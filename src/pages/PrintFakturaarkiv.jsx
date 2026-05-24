import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { Spinner } from 'react-bootstrap';

const PrintFakturaarkiv = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchInvoice = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('fakturaarkiv')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setInvoice(data);
        } catch (error) {
            console.error('Error fetching invoice:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchInvoice();
    }, [fetchInvoice]);

    useEffect(() => {
        if (!loading && invoice) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, invoice]);

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
                <p className="mt-2">Laster...</p>
            </div>
        );
    }

    if (!invoice) {
        return <div>Faktura ikke funnet</div>;
    }

    const varelinjer = Array.isArray(invoice.varelinjer) ? invoice.varelinjer : [];

    return (
        <div className="print-page">
            {/* Header Section */}
            <div className="header-section">
                <div className="order-details sm-6">
                    <h2>Faktura #{invoice.fakturanummer}</h2>
                    <p>
                        Fakturadato: {invoice.fakturadato}<br />
                        Forfallsdato: {invoice.forfallsdato}
                        {invoice.betalingsdato && (<><br />Betalingsdato: {invoice.betalingsdato}</>)}
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

            {/* Customer Info */}
            <div className="info-section">
                <div className="customer-info">
                    <h4>Kunde</h4>
                    <p>
                        {invoice.navn}<br />
                        {invoice.adresse || ''}
                        {invoice.adresse2 && (<><br />{invoice.adresse2}</>)}
                        {invoice.kontakt && (<><br />Kontakt: {invoice.kontakt}</>)}
                    </p>
                </div>
            </div>

            {/* Items Table */}
            <div className="items-section">
                <table className="items-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>Beskrivelse</th>
                            <th style={{ width: '10%' }}>Antall</th>
                            <th style={{ width: '15%' }}>Pris inkl. mva</th>
                            <th style={{ width: '10%' }}>Mva</th>
                            <th style={{ width: '10%' }}>Rabatt %</th>
                            <th style={{ width: '15%' }}>Sum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {varelinjer.length > 0 ? (
                            varelinjer.map((vl, idx) => (
                                <tr key={idx}>
                                    <td>{vl.linjetekst}</td>
                                    <td>{vl.antall}</td>
                                    <td>{vl["pris-ink-mva"] ? formatCurrency(vl["pris-ink-mva"]) : '-'}</td>
                                    <td>{vl.mva ? formatCurrency(vl.mva) : '-'}</td>
                                    <td>{vl.rabattprosent ? vl.rabattprosent + ' %' : '-'}</td>
                                    <td>
                                        {vl["pris-ink-mva"] && vl.antall
                                            ? formatCurrency(vl["pris-ink-mva"] * vl.antall * (1 - (vl.rabattprosent || 0) / 100))
                                            : '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} className="text-center">Ingen varelinjer</td></tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="5" className="text-end">Total (eks mva):</td>
                            <td className="text-end">{invoice.pris_eks_mva ? formatCurrency(invoice.pris_eks_mva) : '-'}</td>
                        </tr>
                        <tr>
                            <td colSpan="5" className="text-end">Mva:</td>
                            <td className="text-end">{invoice.moms ? formatCurrency(invoice.moms) : '-'}</td>
                        </tr>
                        <tr>
                            <td colSpan="5" className="text-end">Total (inkl. mva):</td>
                            <td className="text-end fw-bold">{invoice.pris_ink_mva ? formatCurrency(invoice.pris_ink_mva) : '-'}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default PrintFakturaarkiv;
