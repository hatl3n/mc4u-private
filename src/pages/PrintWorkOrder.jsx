import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { Spinner } from 'react-bootstrap';

const PrintWorkOrder = () => {
    const { id } = useParams();
    const [workOrder, setWorkOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkOrder();
    }, [id]);

    useEffect(() => {
        if (!loading && workOrder) {
            // Auto-print when loaded
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, workOrder]);

    const fetchWorkOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('work_orders')
                .select(`
          *,
          items:work_order_lines(*),
          customer:customer_id (*),
          bike:bike_id (*)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setWorkOrder(data);
        } catch (error) {
            console.error('Error fetching work order:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = (items) => {
        const totalExVat = items?.reduce((sum, item) => sum + (item.price_ex_vat * item.quantity), 0) || 0;
        const totalIncVat = items?.reduce((sum, item) => sum + item.line_total_inc_vat, 0) || 0;
        const totalVat = totalIncVat - totalExVat;

        return {
            totalExVat: parseFloat(totalExVat.toFixed(2)),
            totalVat: parseFloat(totalVat.toFixed(2)),
            totalIncVat: parseFloat(totalIncVat.toFixed(2))
        };
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('no-NO', {
            style: 'currency',
            currency: 'NOK'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="text-center p-4">
                <Spinner animation="border" />
                <p className="mt-2">Loading...</p>
            </div>
        );
    }

    if (!workOrder) {
        return <div>Work order not found</div>;
    }

    return (
        <div className="print-page">
            {/* Header Section with Work Order number and date */}
            <div className="header-section">
                <div className="order-details sm-6">
                    <h2>Arbeidsordre #{workOrder.id}</h2>
                    <p>
                        Dato: {new Date(workOrder.created_at).toLocaleDateString('no-NO')}
                        <br/>
                        Odometer: {workOrder.odometer}
                    </p>
                </div>
                <div className="company-header sm-6">
                    <h4>MC4U</h4>
                    <p>
                        Storgaten 117<br />
                        3182 Horten<br />
                        Telefon: 413 16 336<br />
                        Epost: post@mc4u.no<br />
                        Org.nr: 925262323MVA
                    </p>
                </div>
            </div>

            {/* Customer & Bike Info */}
            <div className="info-section">
                <div className="customer-info">
                    <h4>Kunde</h4>
                    <p>
                        {workOrder.customer?.name}<br />
                        {workOrder.customer?.address || ''}<br />
                        {workOrder.customer?.postal_code} {workOrder.customer?.city || ''}<br />
                        {workOrder.customer?.email}<br />
                        {workOrder.customer?.phone}
                    </p>
                </div>
                <div className="bike-info">
                    <h4>Sykkel</h4>
                    <p>
                        {workOrder.bike?.make} {workOrder.bike?.model}<br />
                        {workOrder.bike?.model_year && `Year: ${workOrder.bike?.model_year}`}<br />
                        {workOrder.bike?.license_plate && `Reg.nr: ${workOrder.bike?.license_plate}`}<br />
                        {workOrder.bike?.vin && `VIN: ${workOrder.bike?.vin}`}
                    </p>
                </div>
            </div>

            {/* Notes with linebreak support */}
            <div className="notes-section">
                <h4>Fritekst</h4>
                <p style={{ whiteSpace: 'pre-line' }}>
                    {workOrder.notes || 'No notes'}
                </p>
            </div>

            {/* Items Table with more spacing */}
            <div className="items-section">
                <table className="items-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Varelinje</th>
                            <th style={{ width: '10%' }}>Antall</th>
                            <th style={{ width: '15%' }}>Pris eks MVA</th>
                            <th style={{ width: '10%' }}>MVA %</th>
                            <th style={{ width: '10%' }}>Rabatt%</th>
                            <th style={{ width: '15%' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workOrder.items?.map((item, index) => (
                            <tr key={index}>
                                <td>{item.description}</td>
                                <td>{item.quantity}</td>
                                <td>{item.price_ex_vat?.toFixed(2)}</td>
                                <td>{((item.vat_rate - 1) * 100).toFixed(0)}%</td>
                                <td>{item.discount_percent}%</td>
                                <td>{item.line_total_inc_vat?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="5" className="text-end">Total (eks MVA):</td>
                            <td className="text-end">{formatCurrency(calculateTotals(workOrder.items).totalExVat)}</td>
                        </tr>
                        <tr>
                            <td colSpan="5" className="text-end">MVA:</td>
                            <td className="text-end">{formatCurrency(calculateTotals(workOrder.items).totalVat)}</td>
                        </tr>
                        <tr>
                            <td colSpan="5" className="text-end">Total (ink MVA):</td>
                            <td className="text-end fw-bold">{formatCurrency(calculateTotals(workOrder.items).totalIncVat)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Signature Section
            <div className="signature-section">
                <div className="signature-line">
                    <p>Kunde</p>
                    <p>Dato: _______________________</p>
                </div>
                <div className="signature-line">
                    <p>MC4U</p>
                    <p>Dato: _______________________</p>
                </div>
            </div> */}
        </div>
    );
};

export default PrintWorkOrder;