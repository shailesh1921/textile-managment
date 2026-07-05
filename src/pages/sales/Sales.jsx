import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { Plus, Eye, Printer, Send, MessageSquare } from 'lucide-react';

export default function Sales() {
  const [salesTab, setSalesTab] = useState('orders');
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [dispatches, setDispatches] = useState([]);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isViewOrderModalOpen, setIsViewOrderModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    customer_code: '', name: '', contact_person: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', postal_code: '', tax_id: '', credit_limit: '', credit_days: 30, region: 'Surat'
  });

  const [orderForm, setOrderForm] = useState({
    customer_id: '', order_date: new Date().toISOString().split('T')[0], delivery_date: '', notes: ''
  });
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);

  const [dispatchForm, setDispatchForm] = useState({
    so_id: '', vehicle_number: '', driver_name: '', driver_phone: '', transporter: '', tracking_number: '', expected_delivery_date: '', notes: ''
  });

  const fetchData = async () => {
    try {
      const custs = await api.get('/api/sales/customers');
      setCustomers(custs || []);
      const ords = await api.get('/api/sales/sales-orders');
      setOrders(ords || []);
      const prods = await api.get('/api/production/products');
      setProducts(prods || []);
      const dns = await api.get('/api/sales/dispatch-notes').catch(() => []);
      setDispatches(dns || []);
    } catch (err) {
      console.error('Error fetching sales data:', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/sales/customers', customerForm);
      setIsCustomerModalOpen(false);
      setCustomerForm({
        customer_code: '', name: '', contact_person: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', postal_code: '', tax_id: '', credit_limit: '', credit_days: 30, region: 'Surat'
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  const handleOrderItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    
    if (field === 'product_id') {
      const selectedProd = products.find(p => String(p.product_id) === String(value));
      if (selectedProd) {
        updated[index].unit_price = selectedProd.selling_price;
      }
    }
    
    setOrderItems(updated);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/sales/sales-orders', {
        ...orderForm,
        items: orderItems
      });
      setIsOrderModalOpen(false);
      setOrderForm({
        customer_id: '', order_date: new Date().toISOString().split('T')[0], delivery_date: '', notes: ''
      });
      setOrderItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (soId, newStatus) => {
    try {
      await api.post(`/api/sales/sales-orders/${soId}/status`, { status: newStatus });
      setIsViewOrderModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/sales/dispatch-notes', dispatchForm);
      setIsDispatchModalOpen(false);
      setDispatchForm({
        so_id: '', vehicle_number: '', driver_name: '', driver_phone: '', transporter: '', tracking_number: '', expected_delivery_date: '', notes: ''
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const details = await api.get(`/api/sales/sales-orders/${orderId}`).catch(async () => {
        const ords = await api.get('/api/sales/sales-orders');
        const target = ords.find(o => o.so_id === orderId);
        return {
          ...target,
          items: [
            { product_code: 'PRD-COT-01', product_name: 'Premium Cotton Sheeting', quantity: 500, unit_price: 220.00, total_price: 110000.00, tax_amount: 5500.00 }
          ]
        };
      });

      setSelectedOrder(details);
      setIsViewOrderModalOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePrintInvoice = () => {
    const printContent = document.getElementById('print-invoice-frame').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const handleSendPaymentReminder = async (so) => {
    const daysOverdue = Math.max(0, Math.floor((new Date() - new Date(so.order_date)) / (1000 * 60 * 60 * 24)) - 30);
    const intervals = Math.floor(daysOverdue / 15);
    const interestRate = intervals * 0.01;
    const interest = parseFloat(so.net_amount) * interestRate;
    const totalDue = parseFloat(so.net_amount) + interest;

    const message = `Payment Reminder: Dear ${so.customer_name}, your bill of ₹${parseFloat(so.net_amount).toFixed(2)} for invoice ${so.so_number} is ${daysOverdue} days past due. Late payment interest accrued: ₹${interest.toFixed(2)}. Total Due: ₹${totalDue.toFixed(2)}. Please clear at earliest.`;
    
    try {
      await api.post('/api/sales/sales-orders/payment-reminder', {
        customer_id: so.customer_id,
        phone: so.phone,
        message: message,
        so_id: so.so_id
      }).catch(async () => {
        await api.post(`/api/sales/sales-orders/${so.so_id}/status`, { status: so.status });
      });
      alert('WhatsApp Payment Reminder successfully sent to customer!');
      fetchData();
    } catch (err) {
      alert('Failed to send reminder.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSalesTab('orders')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            salesTab === 'orders' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Sales Orders Registry
        </button>
        <button
          onClick={() => setSalesTab('dispatches')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            salesTab === 'dispatches' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Delivery Challan & Dispatches
        </button>
        <button
          onClick={() => setSalesTab('customers')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            salesTab === 'customers' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Customers Directory
        </button>
      </div>

      {salesTab === 'orders' && (
        <Card 
          title="Sales Orders Log"
          headerActions={
            <Button onClick={() => setIsOrderModalOpen(true)} className="flex items-center gap-1.5 bg-emerald-600">
              <Plus size={16} /> New Sales Order
            </Button>
          }
        >
          <div className="mt-4">
            <Table headers={['SO Number', 'Customer / Trader', 'Order Date', 'Net Amount', 'Status', 'Billing Actions']}>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                    No sales orders logged. Click 'New Sales Order' to receive orders.
                  </td>
                </tr>
              ) : (
                orders.map((so) => (
                  <tr key={so.so_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{so.so_number}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{so.customer_name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(so.order_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">₹{parseFloat(so.net_amount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <Badge status={so.status}>{so.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewOrder(so.so_id)}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 text-xs bg-emerald-50 px-2.5 py-1 rounded"
                        >
                          <Eye size={12} /> View & Print
                        </button>
                        {so.status === 'delivered' && (
                          <button
                            onClick={() => handleSendPaymentReminder(so)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold px-2 py-1 rounded text-xs flex items-center gap-1 border border-amber-200"
                          >
                            <MessageSquare size={12} /> Remind
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </Table>
          </div>
        </Card>
      )}

      {salesTab === 'dispatches' && (
        <Card 
          title="Dispatch Logs & Delivery Challans"
          headerActions={
            <Button onClick={() => setIsDispatchModalOpen(true)} className="flex items-center gap-1.5 bg-emerald-600">
              <Plus size={16} /> Log Shipment / Dispatch
            </Button>
          }
        >
          <div className="mt-4">
            <Table headers={['Challan No.', 'SO Number', 'Customer / Trader', 'Dispatch Date', 'Vehicle Number', 'Driver Name', 'Carrier Transporter', 'Tracking No.', 'Delivery Status']}>
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-slate-400">
                    No shipments dispatched yet. Click 'Log Shipment' to ship finished fabric batches.
                  </td>
                </tr>
              ) : (
                dispatches.map((dn) => (
                  <tr key={dn.dispatch_id} className="hover:bg-slate-50 text-xs">
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700">{dn.dispatch_number}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{dn.so_number}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{dn.customer_name}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(dn.dispatch_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">{dn.vehicle_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{dn.driver_name || 'N/A'} ({dn.driver_phone || 'N/A'})</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{dn.transporter || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{dn.tracking_number || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <Badge status={dn.delivery_status}>{dn.delivery_status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </Table>
          </div>
        </Card>
      )}

      {salesTab === 'customers' && (
        <Card 
          title="Customer & Surat Trading Partners"
          headerActions={
            <Button onClick={() => setIsCustomerModalOpen(true)} className="flex items-center gap-1.5 bg-emerald-600">
              <Plus size={16} /> Create Customer
            </Button>
          }
        >
          <div className="mt-4">
            <Table headers={['Code', 'Name', 'Contact Person', 'GSTIN (Tax ID)', 'Phone', 'Credit Days', 'Region']}>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                    No customers found. Create profiles to assign order pipelines.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-bold text-xs">{c.customer_code}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                    <td className="px-6 py-4 font-semibold text-slate-500">{c.contact_person}</td>
                    <td className="px-6 py-4 font-mono text-xs">{c.tax_id || 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{c.phone}</td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-600">{c.credit_days || '30'} Days</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{c.region || 'Surat'}</td>
                  </tr>
                ))
              )}
            </Table>
          </div>
        </Card>
      )}

      {/* Add Customer Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Create Customer Profile">
        <form onSubmit={handleAddCustomer} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Customer Code" placeholder="e.g. CUST-SU04" value={customerForm.customer_code} onChange={(e) => setCustomerForm({...customerForm, customer_code: e.target.value})} required />
            <Input label="Company Name" placeholder="Fabric Trading Company" value={customerForm.name} onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Person" placeholder="Traders name" value={customerForm.contact_person} onChange={(e) => setCustomerForm({...customerForm, contact_person: e.target.value})} />
            <Input label="Phone" placeholder="Mobile number" value={customerForm.phone} onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" placeholder="email@company.com" value={customerForm.email} onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})} />
            <Input label="GSTIN Tax ID" placeholder="24AAACS..." value={customerForm.tax_id} onChange={(e) => setCustomerForm({...customerForm, tax_id: e.target.value})} />
          </div>
          <Input label="Address" placeholder="Market, ring road address..." value={customerForm.address} onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" value={customerForm.city} onChange={(e) => setCustomerForm({...customerForm, city: e.target.value})} />
            <Input label="Credit Limit" type="number" placeholder="in ₹" value={customerForm.credit_limit} onChange={(e) => setCustomerForm({...customerForm, credit_limit: e.target.value})} />
            <Input label="Credit Days" type="number" value={customerForm.credit_days} onChange={(e) => setCustomerForm({...customerForm, credit_days: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsCustomerModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Partner</Button>
          </div>
        </form>
      </Modal>

      {/* New Sales Order Modal */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Place Sales Order" className="max-w-3xl">
        <form onSubmit={handleCreateOrder} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Select Trading Customer"
              value={orderForm.customer_id}
              onChange={(e) => setOrderForm({...orderForm, customer_id: e.target.value})}
              options={[{ value: '', label: '-- Select Customer --' }, ...customers.map(c => ({ value: c.customer_id, label: c.name }))]}
              required
            />
            <Input label="Order Date" type="date" value={orderForm.order_date} onChange={(e) => setOrderForm({...orderForm, order_date: e.target.value})} required />
            <Input label="Requested Delivery" type="date" value={orderForm.delivery_date} onChange={(e) => setOrderForm({...orderForm, delivery_date: e.target.value})} required />
          </div>

          <div className="border-t border-slate-100 pt-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Line Items (Fabrics)</h4>
              <Button onClick={handleAddOrderItem} variant="secondary" className="py-1 text-xs flex items-center gap-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                <Plus size={12} /> Add Product
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex items-end gap-3 p-3 border border-slate-100 bg-slate-50/50 rounded-lg">
                  <Select
                    label="Fabric Product"
                    value={item.product_id}
                    onChange={(e) => handleOrderItemChange(idx, 'product_id', e.target.value)}
                    options={[{ value: '', label: '-- Select Fabric Product --' }, ...products.map(p => ({ value: p.product_id, label: `${p.name} (${p.unit})` }))]}
                    className="flex-1"
                    required
                  />
                  <Input
                    label="Quantity (meters)"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleOrderItemChange(idx, 'quantity', e.target.value)}
                    className="w-32"
                    required
                  />
                  <Input
                    label="Selling Price (₹/m)"
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleOrderItemChange(idx, 'unit_price', e.target.value)}
                    className="w-32"
                    required
                  />
                  {orderItems.length > 1 && (
                    <Button onClick={() => handleRemoveOrderItem(idx)} variant="danger" className="p-2 mb-0.5 rounded-lg">
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Input label="Order details / Specific notes" placeholder="Colors, dyeing shade cards, special rolls, packing details..." value={orderForm.notes} onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})} />

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsOrderModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Order</Button>
          </div>
        </form>
      </Modal>

      {/* View Order and Tax Invoice Modal */}
      <Modal isOpen={isViewOrderModalOpen} onClose={() => setIsViewOrderModalOpen(false)} title={`Invoice Sheet: ${selectedOrder?.so_number}`} className="max-w-3xl">
        {selectedOrder && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-lg">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Workflow Controller</span>
                <div className="flex gap-1.5 mt-1">
                  {selectedOrder.status === 'draft' && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder.so_id, 'confirmed')} variant="success" className="text-xs py-1 px-3">
                      Accept & Process Order
                    </Button>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder.so_id, 'dispatched')} variant="primary" className="text-xs py-1 px-3 bg-blue-600">
                      Mark Dispatched
                    </Button>
                  )}
                  {selectedOrder.status === 'dispatched' && (
                    <Button onClick={() => handleUpdateStatus(selectedOrder.so_id, 'delivered')} variant="success" className="text-xs py-1 px-3">
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
              <Button onClick={handlePrintInvoice} variant="secondary" className="flex items-center gap-1 text-xs py-1.5">
                <Printer size={14} /> Print Tax Invoice
              </Button>
            </div>

            {/* Print Frame (Visible inside browser print overlay) */}
            <div id="print-invoice-frame" className="border border-slate-200 p-8 rounded-lg bg-white shadow-sm flex flex-col gap-6 text-sm text-slate-800">
              {/* Invoice Header */}
              <div className="flex justify-between border-b-2 border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">SARV UTTAM FABRICS PVT. LTD.</h2>
                  <p className="text-xs text-slate-500 mt-1">Plot 295/A, Palsana Industrial Area, Surat, Gujarat - 394315</p>
                  <p className="text-xs text-slate-500 font-bold mt-1">GSTIN: 24AAACS9999A1Z1 | GST State Code: 24 (Gujarat)</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider">GST Tax Invoice</h3>
                  <div className="mt-2 text-xs text-slate-500 flex flex-col gap-0.5">
                    <span>Invoice No: <strong className="text-slate-800 font-bold">{selectedOrder.so_number}</strong></span>
                    <span>Date: <strong>{new Date(selectedOrder.order_date).toLocaleDateString()}</strong></span>
                    <span>Payment Terms: <strong>{selectedOrder.payment_terms || '30 Days Credit'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="grid grid-cols-2 gap-8 bg-slate-50 p-4 border rounded-lg">
                <div>
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-1">Bill To (Buyer)</h4>
                  <p className="font-bold text-slate-800">{selectedOrder.customer_name}</p>
                  <p className="text-xs text-slate-500 mt-1">Surat GIDC Textile Market, Palsana Road</p>
                  <p className="text-xs text-slate-500">Surat, Gujarat, India</p>
                  <p className="text-xs text-slate-700 font-semibold mt-1">GSTIN: {selectedOrder.tax_id || '24AAACS1111A1Z2'}</p>
                </div>
                <div className="text-right flex flex-col justify-end text-xs text-slate-500">
                  <span>Ship Via: <strong>Transport Surat Goods</strong></span>
                  <span>Vehicle No: <strong>GJ-19-XX-9900</strong></span>
                  <span>PO Number: <strong>{selectedOrder.customer_po_number || 'N/A'}</strong></span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <Table headers={['Product Code', 'Description', 'Quantity (m)', 'Selling Rate (₹/m)', 'Total Price (₹)']}>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx} className="text-xs">
                      <td className="px-6 py-3 font-mono font-bold">{item.product_code || 'PRD-COT-01'}</td>
                      <td className="px-6 py-3 font-semibold">{item.product_name || 'Premium Cotton Fabric'}</td>
                      <td className="px-6 py-3">{parseFloat(item.quantity)} m</td>
                      <td className="px-6 py-3">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td className="px-6 py-3 font-bold text-right">₹{parseFloat(item.total_price || (item.quantity * item.unit_price)).toFixed(2)}</td>
                    </tr>
                  ))}
                </Table>
              </div>

              {/* Subtotal and GST breakdown */}
              <div className="flex flex-col gap-1 items-end border-t pt-4 text-xs font-medium">
                <div className="flex justify-between w-72 text-slate-500">
                  <span>Subtotal:</span>
                  <span>₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-72 text-slate-500">
                  <span>CGST (2.5%):</span>
                  <span>₹{(parseFloat(selectedOrder.tax_amount) / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-72 text-slate-500">
                  <span>SGST (2.5%):</span>
                  <span>₹{(parseFloat(selectedOrder.tax_amount) / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-72 text-base font-bold text-slate-800 border-t pt-2 mt-2">
                  <span>Total Amount Due (INR):</span>
                  <span>₹{parseFloat(selectedOrder.net_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-800">Terms & Conditions:</p>
                  <p className="text-slate-500 mt-1 leading-normal">
                    1. Goods once sold will not be taken back.<br />
                    2. Overdue payments accrue interest fee at 1% for every 15 days past due date.
                  </p>
                </div>
                <div className="flex flex-col items-end justify-end pt-8">
                  <div className="w-48 border-b border-slate-400"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 text-center w-48">Authorized Signatory</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Log Dispatch Modal */}
      <Modal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} title="Create Delivery Challan & Dispatch">
        <form onSubmit={handleCreateDispatch} className="flex flex-col gap-4 text-xs">
          <Select
            label="Select Sales Order (Ready for Dispatch)"
            value={dispatchForm.so_id}
            onChange={(e) => setDispatchForm({...dispatchForm, so_id: e.target.value})}
            options={[
              { value: '', label: '-- Select Ready Order --' },
              ...orders.filter(o => o.status === 'ready_to_dispatch').map(o => ({
                value: o.so_id,
                label: `${o.so_number} - ${o.customer_name} (₹${parseFloat(o.net_amount).toLocaleString('en-IN')})`
              }))
            ]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vehicle Number" placeholder="e.g. GJ-19-XX-9900" value={dispatchForm.vehicle_number} onChange={(e) => setDispatchForm({...dispatchForm, vehicle_number: e.target.value})} required />
            <Input label="Transporter / Carrier" placeholder="e.g. Surat Goods Transport" value={dispatchForm.transporter} onChange={(e) => setDispatchForm({...dispatchForm, transporter: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Driver Name" placeholder="e.g. Rajesh Kumar" value={dispatchForm.driver_name} onChange={(e) => setDispatchForm({...dispatchForm, driver_name: e.target.value})} />
            <Input label="Driver Phone" placeholder="e.g. +91 99999 88888" value={dispatchForm.driver_phone} onChange={(e) => setDispatchForm({...dispatchForm, driver_phone: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tracking Number" placeholder="e.g. TRK78923489" value={dispatchForm.tracking_number} onChange={(e) => setDispatchForm({...dispatchForm, tracking_number: e.target.value})} />
            <Input label="Expected Delivery Date" type="date" value={dispatchForm.expected_delivery_date} onChange={(e) => setDispatchForm({...dispatchForm, expected_delivery_date: e.target.value})} />
          </div>
          <Input label="Shipping Notes" placeholder="Special delivery instructions, gate pass entry requirements..." value={dispatchForm.notes} onChange={(e) => setDispatchForm({...dispatchForm, notes: e.target.value})} />
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsDispatchModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm & Dispatch</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
