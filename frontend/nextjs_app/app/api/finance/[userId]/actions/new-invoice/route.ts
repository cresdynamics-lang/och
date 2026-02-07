import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const body = await request.json();

    // Mock invoice creation - replace with database operations
    const newInvoice = {
      id: `INV-${Date.now()}`,
      client: body.client || "New Client",
      amount: body.amount || 0,
      description: body.description || "Professional Services",
      dueDate: body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "draft",
      createdAt: new Date().toISOString(),
      items: body.items || [
        { description: "Cybersecurity Training", quantity: 1, rate: 50000, amount: 50000 }
      ]
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "Invoice created successfully",
      invoice: newInvoice
    });
  } catch (error) {
    console.error('New invoice error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
