/**
*    File        : frontend/js/controllers/subjectsController.js
*    Project     : CRUD PHP
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Mayo 2025
*    Status      : Prototype
*    Iteration   : 3.0 ( prototype )
*/

import { subjectsAPI } from '../api/subjectsAPI.js';

//2.0
//For pagination:
let currentPage = 1;
let totalPages = 1;
const limit = 5;

let allSubjectsCache = [];

document.addEventListener('DOMContentLoaded', () => 
{
    loadSubjects();
    setupSubjectFormHandler();
    setupCancelHandler();
    setupPaginationControls();//2.0
});


async function cacheAllSubjects() {
    try {
        allSubjectsCache = await subjectsAPI.fetchAll();
    } catch (err) {
        console.error("Error cargando caché de materias para validación:", err.message);
    }
}

function setupSubjectFormHandler() 
{
  const form = document.getElementById('subjectForm');
  form.addEventListener('submit', async e => 
  {
        e.preventDefault();

        const subjectId = document.getElementById('subjectId').value.trim();
        const subjectName = document.getElementById('name').value.trim();

        if (!subjectName) {
            alert("El nombre de la materia no puede estar vacío.");
            return;
        }

        
        const isDuplicate = allSubjectsCache.some(
            s => s.name.toLowerCase() === subjectName.toLowerCase() && s.id.toString() !== subjectId
        );

        if (isDuplicate) {
            alert("Error: Ya existe una materia con ese nombre.");
            return; // Detiene el envío
        }
        

        const subject = 
        {
            id: subjectId,
            name: subjectName
        };

        try 
        {
            if (subject.id) 
            {
                await subjectsAPI.update(subject);
            }
            else
            {
                await subjectsAPI.create(subject);
            }
            
            form.reset();
            document.getElementById('subjectId').value = '';
            loadSubjects();
            cacheAllSubjects(); // Actualizar la caché
        }
        catch (err)
        {
            if (err.message.includes("409")) {
                alert("Error: La materia con ese nombre ya existe (detectado por el servidor).");
            } else {
                console.error(err.message);
                alert("Error al guardar la materia.");
            }
        }
  });
}

function setupCancelHandler()
{
    const cancelBtn = document.getElementById('cancelBtn');
    cancelBtn.addEventListener('click', () => 
    {
        document.getElementById('subjectId').value = '';
    });
}

function setupPaginationControls() 
{
    document.getElementById('prevPage').addEventListener('click', () => 
    {
        if (currentPage > 1) 
        {
            currentPage--;
            loadSubjects();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => 
    {
        if (currentPage < totalPages) 
        {
            currentPage++;
            loadSubjects();
        }
    });

    document.getElementById('resultsPerPage').addEventListener('change', e => 
    {
        currentPage = 1;
        loadSubjects();
    });
}

// Agrega debug en subjectsController.js
//2.0
async function loadSubjects()
{
    try 
    {
        const resPerPage = parseInt(document.getElementById('resultsPerPage').value, 10) || limit;
        const data = await subjectsAPI.fetchPaginated(currentPage, resPerPage);
        console.log(data);
        renderSubjectTable(data.subjects);
        totalPages = Math.ceil(data.total / resPerPage);
        document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${totalPages}`;
    } 
    catch (err) 
    {
        console.error('Error cargando materias:', err.message);
    }
}

function renderSubjectTable(subjects)
{
    const tbody = document.getElementById('subjectTableBody');
    tbody.replaceChildren();

    subjects.forEach(subject =>
    {
        const tr = document.createElement('tr');

        tr.appendChild(createCell(subject.name));
        tr.appendChild(createSubjectActionsCell(subject));

        tbody.appendChild(tr);
    });
}

function createCell(text)
{
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

function createSubjectActionsCell(subject)
{
    const td = document.createElement('td');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Editar';
    editBtn.className = 'w3-button w3-blue w3-small';
    editBtn.addEventListener('click', () => 
    {
        document.getElementById('subjectId').value = subject.id;
        document.getElementById('name').value = subject.name;
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Borrar';
    deleteBtn.className = 'w3-button w3-red w3-small w3-margin-left';
    deleteBtn.addEventListener('click', () => confirmDeleteSubject(subject.id));

    td.appendChild(editBtn);
    td.appendChild(deleteBtn);
    return td;
}

async function confirmDeleteSubject(id)
{
    if (!confirm('¿Seguro que deseas borrar esta materia?')) return;

    try
    {
        await subjectsAPI.remove(id);
        loadSubjects();
    }
    catch (err)
    {
        console.error('Error al borrar materia:', err.message);
    }
}
