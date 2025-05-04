import { useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { supabase } from "../supabase";

export const VegvesenAutoFormFill = (formItem, setFormItem) => {
    const [loading, setLoading] = useState(false);
    const fetchVehicleInfo = async () => {
        if (!formItem.license_plate) {
            alert('Please enter a license plate number first');
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.functions.invoke('api-call-with-secret-header', {
            body: {
                name: 'Functions',
                regnr: formItem.license_plate
            }
        });
        if (!error) {
            console.log('Fetched vehicle info:', data);
            // Update form with the fetched data
            setFormItem(prev => ({
                ...prev,
                make: data?.kjoretoydataListe?.[0]?.godkjenning?.tekniskGodkjenning?.tekniskeData?.generelt?.merke?.[0]?.merke || data.make,
                model: data?.kjoretoydataListe?.[0]?.godkjenning?.tekniskGodkjenning?.tekniskeData?.generelt?.handelsbetegnelse?.[0] || prev.model,
                model_year: data?.kjoretoydataListe?.[0]?.forstegangsregistrering?.registrertForstegangNorgeDato || data.year,
                vin: data?.kjoretoydataListe[0]?.kjoretoyId?.understellsnummer || data.vin
            }));
        } else {
            alert('Failed to fetch vehicle information');
            console.error(error);
        }

        setLoading(false);
    };

    return (
        <Button variant='info' onClick={fetchVehicleInfo} disabled={loading}>
            Hent regnr-info fra Vegvesen
            {loading && <Spinner as="span" className="ms-2" animation="border" size="sm" aria-hidden="true" role="status" /> }
        </Button>
    );
};