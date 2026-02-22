import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    const selectResult = await query("SELECT id, quantity_in, quantity_out FROM inventory WHERE dress_name LIKE '%MULMUL%'");

    const updates = [];
    for (const item of selectResult.rows) {
        const newCurrentStock = Math.max(0, parseInt(item.quantity_in) - parseInt(item.quantity_out));
        const updateResult = await query(
            "UPDATE inventory SET current_stock = $1 WHERE id = $2 RETURNING *",
            [newCurrentStock, item.id]
        );
        updates.push(updateResult.rows[0]);
    }

    return NextResponse.json(updates);
}
