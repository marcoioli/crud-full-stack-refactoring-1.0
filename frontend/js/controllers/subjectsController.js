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

// --- INICIO DE LA VALIDACIÓN 2 ---
// Caché para guardar todas las materias y validar duplicados en el frontend
let allSubjectsCache = [];

// Elementos del Modal de W3.CSS
let validationModal, modalTitle, modalMessage, closeModalBtn, closeModalFooterBtn;
// --- FIN DE LA VALIDACIÓN 2 ---


document.addEventListener('DOMContentLoaded', () => 
{
    // --- INICIO DE LA VALIDACIÓN 2 (Referencias del Modal) ---
    validationModal = document.getElementById('validationModal');
    modalTitle = document.getElementById('modalTitle');
    modalMessage = document.getElementById('modalMessage');
    closeModalBtn = document.getElementById('closeModalBtn'); // 'X' en la cabecera
    closeModalFooterBtn = document.getElementById('closeModalFooterBtn'); // Botón en el pie

    // Eventos para cerrar el modal
    closeModalBtn.addEventListener('click', hideModal);
    closeModalFooterBtn.addEventListener('click', hideModal);
    // --- FIN DE LA VALIDACIÓN 2 (Referencias del Modal) ---

    loadSubjects();
    cacheAllSubjects(); // --- VALIDACIÓN 2 --- Carga la caché completa
    setupSubjectFormHandler();
    setupCancelHandler();
    setupPaginationControls();//2.0
});

// --- INICIO DE LA VALIDACIÓN 2 (Funciones del Modal) ---
/**
 * Muestra el modal de validación con un mensaje y título.
 */
function showModal(message, title = 'Error de Validación') {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    validationModal.style.display = 'block';
}

/**
 * Oculta el modal de validación.
 */
function hideModal() {
    validationModal.style.display = 'none';
}

/**
 * Obtiene todas las materias y las guarda en la caché para validación.
 */
async function cacheAllSubjects() {
    try {
        allSubjectsCache = await subjectsAPI.fetchAll();
    } catch (err) {
        console.error("Error cargando caché de materias para validación:", err.message);
    }
}
// --- FIN DE LA VALIDACIÓN 2 (Funciones del Modal) ---

  
function setupSubjectFormHandler()
{
    const form = document.getElementById('subjectForm');
    form.addEventListener('submit', async e => 
    {
        e.preventDefault();

        // --- INICIO DE LA VALIDACIÓN 2 (Lógica Frontend) ---
        const subjectId = document.getElementById('subjectId').value.trim();
        const subjectName = document.getElementById('name').value.trim();

        // 1. Validación de campo vacío
        if (!subjectName) {
            showModal("El nombre de la materia no puede estar vacío.");
            return;
        }

        // 2. Validación de duplicados (usa la caché)
        const isDuplicate = allSubjectsCache.some(
            s => s.name.toLowerCase() === subjectName.toLowerCase() && s.id.toString() !== subjectId
        );

        if (isDuplicate) {
            showModal("Error: Ya existe una materia con ese nombre.");
            return; // Detiene el envío
        }
        // --- FIN DE LA VALIDACIÓN 2 (Lógica Frontend) ---

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
            cacheAllSubjects(); // --- VALIDACIÓN 2 --- Actualizar la caché
        }
        catch (err)
        {
            // --- INICIO DE LA VALIDACIÓN 2 (Manejo de Error Backend) ---
            if (err.message.includes("409")) {
                showModal("Error: La materia con ese nombre ya existe (detectado por el servidor).");
            } else {
                console.error(err.message);
                showModal("Error al guardar la materia. Detalles: " + err.message);
            }
            // --- FIN DE LA VALIDACIÓN 2 (Manejo de Error Backend) ---
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
        // --- VALIDACIÓN 2 --- Mostrar error en el modal
        showModal('Error al borrar la materia. Es posible que esté asignada a un estudiante.');
    }
}