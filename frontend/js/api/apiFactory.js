/**
*    File        : frontend/js/api/apiFactory.js
*    Project     : CRUD PHP
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Mayo 2025
*    Status      : Prototype
*    Iteration   : 2.0 ( prototype )
*/


export function createAPI(moduleName, config = {}) 
{
    const API_URL = config.urlOverride ?? `../../backend/server.php?module=${moduleName}`;
    console.log('API URL para', moduleName, ':', API_URL); // Debug temporal

    async function sendJSON(method, data) 
    {
        console.log(`Enviando ${method} a ${API_URL} con:`, data); // Debug
        const res = await fetch(API_URL,
        {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        console.log('Respuesta HTTP:', res.status, res.statusText); // Debug

        if (!res.ok) throw new Error(`Error en ${method}: ${res.status}`);
        const result = await res.json();
        console.log('Resultado:', result); // Debug
        return result;
    }

    return {
        async fetchAll()
        {
            console.log(`Obteniendo todos los datos de ${moduleName}`); // Debug
            const res = await fetch(API_URL);
            console.log('Status fetchAll:', res.status); // Debug
            if (!res.ok) throw new Error(`No se pudieron obtener los datos: ${res.status}`);
            const data = await res.json();
            console.log('Datos obtenidos:', data); // Debug
            return data;
        },
        //2.0
        async fetchPaginated(page = 1, limit = 10)
        {
            const url = `${API_URL}&page=${page}&limit=${limit}`;
            const res = await fetch(url);
            if (!res.ok)
                throw new Error("Error al obtener datos paginados");
            return await res.json();
        },
        async create(data)
        {
            return await sendJSON('POST', data);
        },
        async update(data)
        {
            return await sendJSON('PUT', data);
        },
        async remove(id)
        {
            return await sendJSON('DELETE', { id });
        }
    };
}