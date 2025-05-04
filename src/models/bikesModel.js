export const bikesModel = {
    name: "Sykler",
    endpoint: "bikes", // Supabase table name
    fields: [
        {
            key: "created_at",
            label: "Opprettet",
            type: "date",
            editable: false,
            valueOverride: (i) => i.created_at ? new Date(i.created_at).toLocaleString("no-NO") : '-'
        },
        {
            key: "license_plate",
            label: "Skiltnummer",
            type: "text",
            searchable: true
        },
        {
            key: "vin",
            label: "Rammenummer",
            type: "text",
            searchable: true
        },
        {
            key: "make",
            label: "Merke",
            type: "text",
            searchable: true
        },
        {
            key: "model",
            label: "Modellbetegnelse",
            type: "text",
            searchable: true
        },
        {
            key: "model_year",
            label: "Årsmodell",
            type: "text",
            searchable: true
        }
    ],
    defaultSort: {
        key: "created_at",
        direction: "desc"
    },
    actions: {
        create: true,
        edit: true,
        delete: true,
        custom: [
            {
                label: "SVV",
                icon: "🔎",
                variant: "info",
                onClick: (item) => {
                    window.open(`https://www.vegvesen.no/kjoretoy/kjop-og-salg/kjoretoyopplysninger/sjekk-kjoretoyopplysninger/?registreringsnummer=${item.license_plate}`, "_blank");
                }
            }
        ]
    }
};