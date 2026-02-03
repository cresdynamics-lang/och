import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Mock reminder sending - replace with actual email service
    const remindersSent = [
      { client: "MTN", amount: "KES 500,000", status: "sent" },
      { client: "Ecobank", amount: "KES 200,000", status: "sent" },
      { client: "Vodacom", amount: "KES 300,000", status: "sent" }
    ];

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: "Payment reminders sent successfully",
      reminders: remindersSent,
      count: remindersSent.length
    });
  } catch (error) {
    console.error('Payment reminders error:', error);
    return NextResponse.json({ error: 'Failed to send payment reminders' }, { status: 500 });
  }
}
