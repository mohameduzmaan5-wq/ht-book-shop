export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';

// Trigger a real-time event broadcast to the Socket.io server
async function triggerBroadcast(event: string, data: any) {
  try {
    await fetch('http://localhost:3001/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
    });
  } catch (err) {
    // If the websocket server is not running, fail silently without crashing the API
    console.warn(`[Broadcast failed] WebSocket server offline for event ${event}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, args = [] } = body;

    if (!method) {
      return NextResponse.json({ error: 'Missing method' }, { status: 400 });
    }

    // Dynamic type assertion
    const dbInstance = db as any;

    if (typeof dbInstance[method] !== 'function') {
      return NextResponse.json({ error: `Method ${method} not found on database driver` }, { status: 404 });
    }

    // Role-based auth verification (simplified for local multi-PC use)
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer ', '').trim();
    
    // List of super admin only methods
    const adminOnlyMethods = [
      'getAuditLogs',
      'createBranch',
      'createEmployee',
      'deactivateEmployee',
      'getExpenses',
    ];

    // List of admin & branch manager methods
    const managerAllowedMethods = [
      'getSuppliers',
      'createSupplier',
      'getPurchaseOrders',
      'createPurchaseOrder',
      'createBook',
      'updateBook',
      'updateInventoryDetails',
      'importSuppliers',
      'importInventory',
      'importCustomers',
    ];

    if (
      adminOnlyMethods.includes(method) || 
      managerAllowedMethods.includes(method) || 
      method === 'recordCustomerPayment' ||
      method === 'updateUserProfile'
    ) {
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized. Login required.' }, { status: 401 });
      }
      const callerUser = await db.getUser(userId);
      if (!callerUser) {
        return NextResponse.json({ error: 'Forbidden. Invalid user.' }, { status: 403 });
      }

      if (adminOnlyMethods.includes(method) && callerUser.role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
      }

      if (managerAllowedMethods.includes(method) && callerUser.role !== 'super_admin' && callerUser.role !== 'branch_manager') {
        return NextResponse.json({ error: 'Forbidden. Manager privileges required.' }, { status: 403 });
      }

      if (method === 'updateUserProfile') {
        const targetUserId = args[0];
        if (callerUser.role !== 'super_admin' && callerUser.id !== targetUserId) {
          return NextResponse.json({ error: 'Forbidden. Cannot update other users\' profiles.' }, { status: 403 });
        }
      }
    }

    // Server-side branch isolation for branch_manager and cashier
    const callerForIsolation = userId ? await db.getUser(userId) : null;
    if (callerForIsolation && callerForIsolation.role !== 'super_admin' && callerForIsolation.branch_id) {
      const userBranchId = callerForIsolation.branch_id;
      const branchScopedMethods: Record<string, number> = {
        getSales: 0,
        getInventory: 0,
        getLowStock: 0,
        getTransfers: 0,
        getExpenses: 0,
        getDashboardStats: 0,
        getEmployees: 0,
        getPurchaseOrders: 0,
      };
      if (method in branchScopedMethods) {
        args[branchScopedMethods[method]] = userBranchId;
      }
      // Prevent cashier from calling privileged write methods
      const cashierBlockedMethods = ['createBook', 'updateBook', 'createEmployee', 'deactivateEmployee', 'createBranch', 'createPurchaseOrder', 'importInventory', 'importSuppliers', 'importCustomers'];
      if (callerForIsolation.role === 'cashier' && cashierBlockedMethods.includes(method)) {
        return NextResponse.json({ error: 'Forbidden. Cashier cannot perform this action.' }, { status: 403 });
      }
      // Ensure createSale is always for their branch
      if (method === 'createSale' && args[0]) {
        args[0] = { ...args[0], branchId: userBranchId };
      }
    }

    // Execute database call
    const result = await dbInstance[method](...args);

    // If this was a mutating method, trigger real-time WebSocket sync events
    if (method === 'createSale') {
      await triggerBroadcast('sales:created', { sale: result });
      await triggerBroadcast('inventory:updated', {});
      await triggerBroadcast('notifications:updated', {});
      
      // Audit log creation
      await db.createAuditLog({
        user_id: args[0]?.cashierId || 'system',
        action: 'CREATE_SALE',
        entity_type: 'sale',
        entity_id: result.id,
        details: `Sale #${result.id.slice(-8).toUpperCase()} completed: Rs. ${result.total.toFixed(2)}`,
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      });
      await triggerBroadcast('audit:created', {});
    } 
    else if (method === 'updateInventoryQuantity') {
      await triggerBroadcast('inventory:updated', { branchId: args[0] });
    } 
    else if (method === 'createBook') {
      await triggerBroadcast('books:created', { book: result });
      await triggerBroadcast('inventory:updated', {});
    } 
    else if (method === 'createTransfer' || method === 'updateTransferStatus') {
      await triggerBroadcast('transfers:updated', {});
      await triggerBroadcast('inventory:updated', {});
      await triggerBroadcast('notifications:updated', {});
    } 
    else if (method === 'createEmployee' || method === 'deactivateEmployee' || method === 'updateUserProfile') {
      await triggerBroadcast('employees:updated', {});
    } 
    else if (method === 'updateSettings') {
      await triggerBroadcast('settings:updated', {});
    } 
    else if (method === 'updateNotification' || method === 'markAllNotificationsRead' || method === 'createNotification') {
      await triggerBroadcast('notifications:updated', {});
    }
    else if (method === 'recordCustomerPayment') {
      await triggerBroadcast('sales:updated', {});
      await triggerBroadcast('customers:updated', {});
      await triggerBroadcast('audit:created', {});
    }
    else if (method === 'createSupplier') {
      await triggerBroadcast('suppliers:updated', { supplier: result });
    }
    else if (method === 'createPurchaseOrder') {
      await triggerBroadcast('purchase_orders:updated', { order: result });
      await triggerBroadcast('inventory:updated', {});
      await triggerBroadcast('audit:created', {});
    }
    else if (method === 'importSuppliers') {
      await triggerBroadcast('suppliers:updated', {});
    }
    else if (method === 'importInventory') {
      await triggerBroadcast('books:created', {});
      await triggerBroadcast('inventory:updated', { branchId: args[0] });
    }
    else if (method === 'importCustomers') {
      await triggerBroadcast('sales:updated', {});
      await triggerBroadcast('customers:updated', {});
      await triggerBroadcast('audit:created', {});
    }

    return NextResponse.json(result === undefined ? null : result);
  } catch (error: any) {
    console.error('RPC Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
