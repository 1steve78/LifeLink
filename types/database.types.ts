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
  | "O-"
  | "unknown";
export type PledgeStatus = "pledged" | "confirmed" | "completed" | "withdrawn";
export type VerificationGate = "basic_validation" | "document_analysis" | "risk_screening" | "moderator_review";
export type VerificationResultStatus = "pending" | "passed" | "flagged" | "failed" | "error" | "approved" | "rejected";
export type ReviewState = "open" | "needs_information";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  blood_group: BloodGroup | null;
  locality: string | null;
  location: { type: "Point"; coordinates: [number, number] } | null;
  last_donation_date: string | null;
  available_to_donate: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BloodRequest {
  id: string;
  requester_id: string;
  patient_name: string | null;
  patient_reference: string | null;
  patient_age: number | null;
  contact_person_name: string | null;
  contact_phone: string | null;
  blood_group: BloodGroup;
  units_needed: number;
  hospital_name: string;
  hospital_address: string | null;
  hospital_location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  } | null;
  required_by: string | null;
  supporting_document_path: string | null;
  document_sha256: string | null;
  urgency: RequestUrgency;
  status: RequestStatus;
  review_state: ReviewState;
  review_revision: number;
  verification_passed: boolean;
  created_at: string;
  updated_at: string;
}

export interface RequestVerificationEvent {
  id: string;
  request_id: string;
  gate: VerificationGate;
  status: VerificationResultStatus;
  details: Record<string, unknown>;
  model: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface DonorPledge {
  id: string;
  request_id: string;
  donor_id: string;
  status: PledgeStatus;
  created_at: string;
  updated_at: string;
}

export interface RequestTrackerEvent {
  id: string;
  request_id: string;
  event_type: string;
  request_status: RequestStatus;
  pledge_count: number;
  confirmed_count: number;
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
          locality?: string | null;
          location?: { type: "Point"; coordinates: [number, number] } | null;
          last_donation_date?: string | null;
          available_to_donate?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          blood_group?: BloodGroup | null;
          locality?: string | null;
          location?: { type: "Point"; coordinates: [number, number] } | null;
          last_donation_date?: string | null;
          available_to_donate?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blood_requests: {
        Row: BloodRequest;
        Insert: {
          id?: string;
          requester_id: string;
          patient_name?: string | null;
          patient_reference?: string | null;
          patient_age?: number | null;
          contact_person_name?: string | null;
          contact_phone?: string | null;
          blood_group: BloodGroup;
          units_needed?: number;
          hospital_name: string;
          hospital_address?: string | null;
          hospital_location?: {
            type: "Point";
            coordinates: [number, number];
          } | null;
          required_by?: string | null;
          supporting_document_path?: string | null;
          document_sha256?: string | null;
          urgency?: RequestUrgency;
          status?: RequestStatus;
          review_state?: ReviewState;
          review_revision?: number;
          verification_passed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          patient_name?: string | null;
          patient_reference?: string | null;
          patient_age?: number | null;
          contact_person_name?: string | null;
          contact_phone?: string | null;
          blood_group?: BloodGroup;
          units_needed?: number;
          hospital_name?: string;
          hospital_address?: string | null;
          hospital_location?: {
            type: "Point";
            coordinates: [number, number];
          } | null;
          required_by?: string | null;
          supporting_document_path?: string | null;
          document_sha256?: string | null;
          urgency?: RequestUrgency;
          status?: RequestStatus;
          review_state?: ReviewState;
          review_revision?: number;
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
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          donor_id?: string;
          status?: PledgeStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      donor_notifications: {
        Row: { id: string; donor_id: string; request_id: string; created_at: string; read_at: string | null };
        Insert: { id?: string; donor_id: string; request_id: string; created_at?: string; read_at?: string | null };
        Update: { id?: string; donor_id?: string; request_id?: string; created_at?: string; read_at?: string | null };
        Relationships: [];
      };
      request_tracker_events: {
        Row: RequestTrackerEvent;
        Insert: {
          id?: string;
          request_id: string;
          event_type: string;
          request_status: RequestStatus;
          pledge_count?: number;
          confirmed_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          event_type?: string;
          request_status?: RequestStatus;
          pledge_count?: number;
          confirmed_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      moderation_audit_events: {
        Row: { id: string; request_id: string; moderator_id: string; action: "approve" | "reject" | "request_information"; previous_status: RequestStatus; new_status: RequestStatus; reason: string; created_at: string };
        Insert: { id?: string; request_id: string; moderator_id: string; action: "approve" | "reject" | "request_information"; previous_status: RequestStatus; new_status: RequestStatus; reason: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      requester_information_responses: {
        Row: { id: string; request_id: string; requester_id: string; message: string; created_at: string };
        Insert: { id?: string; request_id: string; requester_id: string; message: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      request_verification_events: {
        Row: RequestVerificationEvent;
        Insert: {
          id?: string;
          request_id: string;
          gate: VerificationGate;
          status: VerificationResultStatus;
          details?: Record<string, unknown>;
          model?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          gate?: VerificationGate;
          status?: VerificationResultStatus;
          details?: Record<string, unknown>;
          model?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      find_eligible_donors: {
        Args: { target_request_id: string };
        Returns: { donor_id: string; distance_km: number }[];
      };
    };
    Enums: {
      user_role: UserRole;
      request_urgency: RequestUrgency;
      request_status: RequestStatus;
      verification_gate: VerificationGate;
      verification_result_status: VerificationResultStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
