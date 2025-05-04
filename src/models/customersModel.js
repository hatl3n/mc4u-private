export const customersModel = {
    name: "Kunder",
    endpoint: "customers", // Supabase table name
    fields: [
        {
            key: "created_at",
            label: "Opprettet",
            type: "date",
            editable: false,
            valueOverride: (i) => i.created_at ? new Date(i.created_at).toLocaleString("no-NO") : '-'
        },
        {
            key: "name",
            label: "Kunde",
            type: "text",
            searchable: true
        },
        {
            key: "street",
            label: "Adresse",
            type: "text",
            searchable: true
        },
        {
            key: "zip",
            label: "Postnummer",
            type: "integer",
            searchable: true
        },
        {
            key: "city",
            label: "Poststed",
            type: "text",
            searchable: true
        },
        {
            key: "country",
            label: "Land",
            type: "text",
            searchable: true
        },
        {
            key: "phone",
            label: "Telefon",
            type: "text",
            searchable: true
        },
        {
            key: "email",
            label: "Epost",
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
        delete: true
    }
};