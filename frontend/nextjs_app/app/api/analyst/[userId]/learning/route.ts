import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock learning data based on user requirements
    const learningData = {
      track: "Defender",
      level: "Beginner → Intermediate",
      progress: 68,
      nextVideo: {
        title: "SIEM Querying Fundamentals",
        duration: "7min",
        id: "video-123"
      },
      quizBlockers: [
        {
          title: "Alert Triage Fundamentals",
          classAvg: 84,
          id: "quiz-456"
        },
        {
          title: "Log Analysis Basics",
          classAvg: 76,
          id: "quiz-789"
        }
      ],
      assessmentPrereqs: [
        {
          title: "Intermediate SIEM Assessment",
          blocker: "Complete Alert Triage Quiz first"
        }
      ]
    };

    return NextResponse.json(learningData);
  } catch (error) {
    console.error('Error fetching learning data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning data' },
      { status: 500 }
    );
  }
}
