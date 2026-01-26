export interface MentorshipSession {
  id: string
  mentor_id: string
  mentor_name: string
  mentor_avatar?: string
  topic: string
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  meeting_url?: string
  meeting_type: 'zoom' | 'google_meet' | 'in_person'
  notes?: string
}

export interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  sender_type: 'mentor' | 'mentee'
  message: string
  timestamp: string
  attachments?: ChatAttachment[]
  read: boolean
}

export interface ChatAttachment {
  id: string
  filename: string
  file_type: string
  file_size: number
  url: string
  uploaded_at: string
}

export interface MentorPresence {
  mentor_id: string
  online: boolean
  last_seen?: string
  status?: 'available' | 'busy' | 'away'
}

export interface MentorshipFeedback {
  id: string
  session_id: string
  from_mentor: boolean
  content: string
  rating?: number
  timestamp: string
}

