import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { profileOnboardingSchema } from "@/lib/validations/profile";

// GET /api/profile
// Fetches the profile and onboarding completion status for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view your profile." },
        { status: 401 }
      );
    }

    const [userProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const isComplete = Boolean(
      userProfile &&
        userProfile.completedAt &&
        userProfile.fullName &&
        (userProfile.role !== "donor" || userProfile.locality)
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      profile: userProfile ?? null,
      isComplete,
    });
  } catch (err: unknown) {
    console.error("Error fetching profile:", err);
    return NextResponse.json(
      { error: "Internal server error while fetching profile." },
      { status: 500 }
    );
  }
}

// POST /api/profile
// Validates and persists the profile for the authenticated user using Drizzle ORM
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to save your profile." },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    // Server-side validation with Zod
    const validationResult = profileOnboardingSchema.safeParse(body);
    if (!validationResult.success) {
      const flattened = validationResult.error.flatten();
      return NextResponse.json(
        {
          error: "Validation failed. Please review the form fields.",
          fieldErrors: flattened.fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check existing profile to safeguard privileged roles (e.g. moderator)
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    // If user is already a moderator in the database, preserve that role.
    // Otherwise, assign the chosen onboarding role ('requester' | 'donor').
    const assignedRole: "requester" | "donor" | "moderator" =
      existingProfile?.role === "moderator"
        ? "moderator"
        : (data.accountType as "requester" | "donor");

    const now = new Date();
    const isDonor = data.accountType === "donor";

    const profileValues = {
      id: user.id,
      fullName: data.fullName,
      role: assignedRole,
      bloodGroup: data.bloodGroup,
      phone: data.phone ?? null,
      locality: isDonor ? data.locality : (data.locality ?? null),
      location: isDonor && data.latitude != null && data.longitude != null
        ? `SRID=4326;POINT(${data.longitude} ${data.latitude})`
        : null,
      availableToDonate: isDonor ? data.availableToDonate : false,
      lastDonationDate: isDonor ? (data.lastDonationDate ?? null) : null,
      completedAt: now,
      updatedAt: now,
    };

    // Upsert into PostgreSQL via Drizzle ORM
    const [savedProfile] = await db
      .insert(profiles)
      .values(profileValues)
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          fullName: profileValues.fullName,
          role: profileValues.role,
          bloodGroup: profileValues.bloodGroup,
          phone: profileValues.phone,
          locality: profileValues.locality,
          location: profileValues.location,
          availableToDonate: profileValues.availableToDonate,
          lastDonationDate: profileValues.lastDonationDate,
          completedAt: profileValues.completedAt,
          updatedAt: profileValues.updatedAt,
        },
      })
      .returning();

    // Sync user metadata in Supabase Auth so client session stays updated
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: savedProfile.fullName,
          role: savedProfile.role,
          blood_group: savedProfile.bloodGroup,
          phone: savedProfile.phone,
          onboarded: true,
        },
      });
    } catch (metaErr) {
      console.warn("Could not update auth user metadata:", metaErr);
    }

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully.",
      profile: savedProfile,
      isComplete: true,
    });
  } catch (err: unknown) {
    console.error("Error saving profile:", err);
    return NextResponse.json(
      { error: "Failed to persist profile. Please try again." },
      { status: 500 }
    );
  }
}
