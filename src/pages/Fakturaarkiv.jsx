import { useEffect, useState } from "react";
import { Container, Modal, Button, Pagination } from "react-bootstrap";
import { supabase } from "../supabase";
import SuperTable from "../components/SuperTable";

function Fakturaarkiv() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);

    // Flytt fetchInvoices inn i useEffect for å unngå dependency warning

    useEffect(() => {
        async function fetchInvoices() {
            setLoading(true);
            let query = supabase
                .from("fakturaarkiv")
                .select("*", { count: "exact" })
                .order("fakturanummer", { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1);

            if (search) {
                // Only search in: navn, adresse, adresse2, kontakt
                const textColumns = [
                    'navn', 'adresse', 'adresse2', 'kontakt'
                ];
                const orFilters = textColumns.map(col => `${col}.ilike.%${search}%`);
                // For varelinjer (jsonb), use ::text ilike if supported, else skip
                // Supabase/PostgREST does not support ilike on jsonb directly, but you can use a computed column or a view in SQL for fulltext search
                // Here, we try varelinjer::text ilike if supported by your API
                //orFilters.push(`varelinjer::text.ilike.%${search}%`);
                const orFilter = orFilters.join(',');
                if (orFilter) query = query.or(orFilter);
            }

            let { data, error, count } = await query;
            if (!error) {
                setInvoices(data);
                setTotalCount(count || 0);
            }
            setLoading(false);
        }
        fetchInvoices();
    }, [page, search, pageSize]);

    // Ikke bruk client-side filter, alt skjer på serveren nå

    const fakturaModel = {
        name: "Fakturaarkiv",
        endpoint: "fakturaarkiv",
        fields: [
                { key: "fakturanummer", label: "Faktura#", type: "text", searchable: true },
                { key: "navn", label: "Navn", type: "text", searchable: true },
                { key: "fakturadato", label: "Fakturadato", type: "date", searchable: true },
                { key: "pris_ink_mva", label: "Pris inkl. mva", type: "number", searchable: true, valueOverride: (i) => i.pris_ink_mva ? new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' }).format(i.pris_ink_mva) : '-' },
                { key: "moms", label: "Moms", type: "number", searchable: true, valueOverride: (i) => i.moms ? new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' }).format(i.moms) : '-' },
                { key: "adresse", label: "Adresse", type: "text", searchable: true },
                { key: "adresse2", label: "Adresse 2", type: "text", searchable: true },
                { key: "kontakt", label: "Kontakt", type: "text", searchable: true },
                { key: "varelinjer", label: "Varelinjer", type: "text", searchable: true, valueOverride: (i) => (Array.isArray(i.varelinjer) ? i.varelinjer.length + " varer" : '-') }
        ],
        defaultSort: { key: "fakturanummer", direction: "desc" },
        actions: {
            create: false,
            edit: false,
            delete: false,
            custom: [
                {
                    label: "Vis detaljer",
                    icon: "🔍",
                    variant: "info",
                    onClick: (item) => {
                        setSelectedInvoice(item);
                        setShowModal(true);
                    }
                }
            ]
        }
    };

    return (
        <Container className="mt-4">
            <h2>Fakturaarkiv</h2>
            <input
                type="text"
                className="form-control mb-3"
                placeholder="Søk i fakturaer..."
                value={search}
                onChange={e => {
                    setPage(1); // Reset til første side ved nytt søk
                    setSearch(e.target.value);
                }}
            />
                {/* Kompakt tabellvisning */}
                <div style={{ width: '100%' }}>
                    <SuperTable
                        tableData={invoices}
                        dataModel={fakturaModel}
                        loading={loading}
                        onAddBtnClick={null}
                        onEditBtnClick={null}
                        handleSubmit={null}
                    />
                </div>
            {/* Paginering */}
            <div className="d-flex justify-content-center my-3">
                <Pagination>
                    <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                    <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
                    {/* Vis noen sidetall rundt aktiv side */}
                    {(() => {
                        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                        const pageNumbers = [];
                        const start = Math.max(1, page - 2);
                        const end = Math.min(totalPages, page + 2);
                        if (start > 1) pageNumbers.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
                        for (let i = start; i <= end; i++) {
                            pageNumbers.push(
                                <Pagination.Item key={i} active={i === page} onClick={() => setPage(i)}>{i}</Pagination.Item>
                            );
                        }
                        if (end < totalPages) pageNumbers.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
                        return pageNumbers;
                    })()}
                    <Pagination.Next onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= totalCount} />
                    <Pagination.Last onClick={() => setPage(Math.ceil(totalCount / pageSize))} disabled={page * pageSize >= totalCount} />
                </Pagination>
                <span className="ms-3 align-self-center">Side {page} av {Math.max(1, Math.ceil(totalCount / pageSize))} ({totalCount} fakturaer)</span>
            </div>
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Faktura #{selectedInvoice?.fakturanummer}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedInvoice && (
                        <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
                            <div className="d-flex justify-content-between mb-2">
                                <div>
                                    <h5 className="mb-1">{selectedInvoice.navn}</h5>
                                    <div>{selectedInvoice.adresse}</div>
                                    {selectedInvoice.adresse2 && <div>{selectedInvoice.adresse2}</div>}
                                    {selectedInvoice.kontakt && <div>Kontakt: {selectedInvoice.kontakt}</div>}
                                </div>
                                <div className="text-end">
                                    <div><strong>Fakturanr:</strong> {selectedInvoice.fakturanummer}</div>
                                    <div><strong>Fakturadato:</strong> {selectedInvoice.fakturadato}</div>
                                    <div><strong>Forfallsdato:</strong> {selectedInvoice.forfallsdato}</div>
                                    {selectedInvoice.betalingsdato && <div><strong>Betalingsdato:</strong> {selectedInvoice.betalingsdato}</div>}
                                </div>
                            </div>
                            <hr />
                            <h6>Varelinjer</h6>
                            <table className="table table-sm align-middle" style={{ fontSize: '0.95rem' }}>
                                <thead>
                                    <tr>
                                        <th>Beskrivelse</th>
                                        <th>Antall</th>
                                        <th>Pris inkl. mva</th>
                                        <th>Mva</th>
                                        <th>Rabatt %</th>
                                        <th>Sum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(selectedInvoice.varelinjer) && selectedInvoice.varelinjer.length > 0 ? (
                                        selectedInvoice.varelinjer.map((vl, idx) => (
                                            <tr key={idx}>
                                                <td>{vl.linjetekst}</td>
                                                <td>{vl.antall}</td>
                                                <td>{vl["pris-ink-mva"] ? new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' }).format(vl["pris-ink-mva"]) : '-'}</td>
                                                <td>{vl.mva ? new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' }).format(vl.mva) : '-'}</td>
                                                <td>{vl.rabattprosent ? vl.rabattprosent + ' %' : '-'}</td>
                                                <td>{vl["pris-ink-mva"] && vl.antall ? new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' }).format(vl["pris-ink-mva"] * vl.antall * (1 - (vl.rabattprosent || 0) / 100)) : '-'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={6} className="text-center">Ingen varelinjer</td></tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="d-flex flex-column align-items-end mt-3">
                                <div><strong>Mva:</strong> {selectedInvoice.moms ? new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' }).format(selectedInvoice.moms) : '-'}</div>
                                <div><strong>Total inkl. mva:</strong> {selectedInvoice.pris_ink_mva ? new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' }).format(selectedInvoice.pris_ink_mva) : '-'}</div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Lukk
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default Fakturaarkiv;
