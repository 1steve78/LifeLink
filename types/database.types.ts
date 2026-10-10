export type UserRole = "requester" | "donor" | "moderator";
export type RequestUrgency = "critical" | "urgent" | "planned";
export type RequestStatus =
  | "pending_verification"
  | "under_review"
  | "active"
  | "fulfilled"
  | "rejected"
  | "cancelled";
export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";
export type PledgeStatus = "pledged" | "confirmed" | "completed" | "withdrawn";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  blood_group: BloodGroup | null;
  last_donation_date: string | null;
  available_to_donate: boolean;
  created_at: string;
}

export interface BloodRequest {
  id: string;
  requester_id: string;
  patient_name: string;
  blood_group: BloodGroup;
  units_needed: number;
  hospital_name: string;
  hospital_location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  } | null;
  urgency: RequestUrgency;
  status: RequestStatus;
  verification_passed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DonorPledge {
  id: string;
  request_id: string;
  donor_id: string;
  status: PledgeStatus;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          blood_group?: BloodGroup | null;
          last_donation_date?: string | null;
          available_to_donate?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          blood_group?: BloodGroup | null;
          last_donation_date?: string | null;
          available_to_donate?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      blood_requests: {
        Row: BloodRequest;
        Insert: {
          id?: string;
          requester_id: string;
          patient_name: string;
          blood_group: BloodGroup;
          units_needed?: number;
          hospital_name: string;
          hospital_location?: {
            type: "Point";
            coordinates: [number, number];
          } | null;
          urgency?: RequestUrgency;
          status?: RequestStatus;
          verification_passed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          patient_name?: string;
          blood_group?: BloodGroup;
          units_needed?: number;
          hospital_name?: string;
          hospital_location?: {
            type: "Point";
            coordinates: [number, number];
          } | null;
          urgency?: RequestUrgency;
          status?: RequestStatus;
          verification_passed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      donor_pledges: {
        Row: DonorPledge;
        Insert: {
          id?: string;
          request_id: string;
          donor_id: string;
          status?: PledgeStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          donor_id?: string;
          status?: PledgeStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      request_urgency: RequestUrgency;
      request_status: RequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
