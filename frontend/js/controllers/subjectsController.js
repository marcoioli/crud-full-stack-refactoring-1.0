/**
* File        : frontend/js/controllers/subjectsController.js
* Project     : CRUD PHP
* Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
* License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
* Date        : Mayo 2025
* Status      : Prototype
* Iteration   : 3.0 ( prototype )
*/

import { subjectsAPI } from '../api/subjectsAPI.js';

//2.0
//For pagination:
let currentPage = 1;
let totalPages = 1;
const limit = 5;


// Caché para guardar todas las materias y validar duplicados en el frontend
let allSubjectsCache = [];

// Referencia al Modal 
let errorModal;



document.addEventListener('DOMContentLoaded', () => 
{
    // Referencia al modal actualizado
    errorModal = document.getElementById('errorModal');

    loadSubjects();
    cacheAllSubjects(); 
    setupSubjectFormHandler();
    setupCancelHandler();
    setupPaginationControls();//2.0
    
    // Configurar botones del modal
    setupModalControls();
});


function setupModalControls()
{
    const closeModalBtn = document.getElementById('closeErrorModalBtn');
    const closeModalCross = document.getElementById('closeErrorModalCross');
    
    closeModalBtn.addEventListener('click', () => hideErrorModal());
    closeModalCross.addEventListener('click', () => hideErrorModal());
}

function showErrorModal(message) {
    const modalMessage = document.getElementById('errorModalMessage');
    modalMessage.textContent = message;
    errorModal.style.display = 'block';
}

function hideErrorModal() {
    errorModal.style.display = 'none';
}


 //Obtiene todas las materias y las guarda en la caché para validación.

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

        // 1. Validación de campo vacío
        if (!subjectName) {
            showErrorModal("El nombre de la materia no puede estar vacío.");
            return;
        }

        // 2. Validación de duplicados (usa la caché)
        const isDuplicate = allSubjectsCache.some(
            s => s.name.toLowerCase() === subjectName.toLowerCase() && s.id.toString() !== subjectId
        );

        if (isDuplicate) {
            showErrorModal("Error: Ya existe una materia con ese nombre.");
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
            clearForm();
            loadSubjects();
            cacheAllSubjects(); // Actualizar la caché
        }
        catch (err)
        {
           
            if (err.message.includes("409")) {
                showErrorModal("Error: La materia con ese nombre ya existe (detectado por el servidor).");
            } else {
                console.error(err.message);
                showErrorModal("Error al guardar la materia. Detalles: " + err.message);
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

//2.0
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
  
function getFormData()
{
    return {
        id: document.getElementById('subjectId').value.trim(),
        name: document.getElementById('name').value.trim()
    };
}

function clearForm()
{
    document.getElementById('subjectForm').reset();
    document.getElementById('subjectId').value = '';
}

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
        showErrorModal('Error al cargar las materias: ' + err.message);
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
  
function fillForm(subject)
{
    document.getElementById('subjectId').value = subject.id;
    document.getElementById('name').value = subject.name;
}
  
async function confirmDeleteSubject(id)
{
    // 'confirm' es una acción diferente a 'alert'. 
    // Es mejor mantener el 'confirm' nativo para una pregunta de Sí/No.
    // Solo manejaremos el 'alert' de error.
    if (!confirm('¿Seguro que deseas borrar esta materia?')) return;

    try
    {
        await subjectsAPI.remove(id);
        loadSubjects();
        cacheAllSubjects(); // --- VALIDACIÓN 2 --- Actualizar la caché
    }
    catch (err)
    {
        console.error('Error al borrar materia:', err.message);
       // El error 409 lo enviamos desde el Backend si hay asignaciones.
 
        if (err.message.includes("409")) {
            // Si envió 409, muestra el mensaje de conflicto de asignación.
            showErrorModal('Error: No se puede eliminar la materia. Está vinculada a una o más asignaciones de estudiantes.', 'Conflicto de Borrado'); 
        } else {
            // Para cualquier otro error (500, etc.)
            showErrorModal('Error al borrar la materia. Detalles: ' + err.message, 'Error de Operación');
        }
    }
}