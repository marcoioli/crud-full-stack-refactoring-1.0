/**
*    File        : frontend/js/controllers/studentsController.js
*    Project     : CRUD PHP
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Mayo 2025
*    Status      : Prototype
*    Iteration   : 3.0 ( prototype )
*/

import { studentsAPI } from '../api/studentsAPI.js';

//2.0
//For pagination:
let currentPage = 1;
let totalPages = 1;
const limit = 5;

let errorModal; 
let studentsCache = [];

document.addEventListener('DOMContentLoaded', () => 
{

    errorModal = document.getElementById('errorModal'); //referencia a error modal

    loadStudents();
    setupFormHandler();
    setupCancelHandler();
    setupPaginationControls();//2.0

    setupModalControls(); //botones del modal
});
  
function setupFormHandler()
{
    const form = document.getElementById('studentForm');
    form.addEventListener('submit', async e => 
    {
        e.preventDefault();
        const student = getFormData();

        const studentEmail = student.email.toLowerCase();

        const isDuplicateEmail = studentsCache.some(
            s => s.email.toLowerCase() === studentEmail && 
                 s.id.toString() !== student.id 
        );

        if (isDuplicateEmail) {
            showErrorModal("El email ingresado ya existe para otro estudiante. Por favor, utilice uno diferente.");
            return;
        }
    
        try 
        {
            if (student.id) 
            {
                await studentsAPI.update(student);
            } 
            else 
            {
                await studentsAPI.create(student);
            }
            clearForm();
            loadStudents();
        }
        catch (err)
        {
            console.error(err.message);
            if (err.message.includes("409")) {
                showErrorModal("Error: El email que intentas usar ya está registrado.");
            } else {
                 showErrorModal(`Error del servidor al guardar: ${err.message}. Revise la consola.`);
            }
        }
    });
}

function setupCancelHandler()
{
    const cancelBtn = document.getElementById('cancelBtn');
    cancelBtn.addEventListener('click', () => 
    {
        document.getElementById('studentId').value = '';
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
            loadStudents();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => 
    {
        if (currentPage < totalPages) 
        {
            currentPage++;
            loadStudents();
        }
    });

    document.getElementById('resultsPerPage').addEventListener('change', e => 
    {
        currentPage = 1;
        loadStudents();
    });
}
  
function getFormData()
{
    return {
        id: document.getElementById('studentId').value.trim(),
        fullname: document.getElementById('fullname').value.trim(),
        email: document.getElementById('email').value.trim(),
        age: parseInt(document.getElementById('age').value.trim(), 10)
    };
}

function clearForm()
{
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
}

//2.0
async function loadStudents()
{
    try 
    {
        studentsCache = await studentsAPI.fetchAll();
        const resPerPage = parseInt(document.getElementById('resultsPerPage').value, 10) || limit;
        const data = await studentsAPI.fetchPaginated(currentPage, resPerPage);
        console.log(data);
        renderStudentTable(data.students);
        totalPages = Math.ceil(data.total / resPerPage);
        document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${totalPages}`;
    } 
    catch (err) 
    {
        console.error('Error cargando estudiantes:', err.message);
        showErrorModal(`Error fatal al cargar estudiantes: ${err.message}. Revise la consola (F12) y el backend.`);
    }
}
  
function renderStudentTable(students)
{
    const tbody = document.getElementById('studentTableBody');
    tbody.replaceChildren();
  
    students.forEach(student => 
    {
        const tr = document.createElement('tr');
    
        tr.appendChild(createCell(student.fullname));
        tr.appendChild(createCell(student.email));
        tr.appendChild(createCell(student.age.toString()));
        tr.appendChild(createActionsCell(student));
    
        tbody.appendChild(tr);
    });
}
  
function createCell(text)
{
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}
  
function createActionsCell(student)
{
    const td = document.createElement('td');
  
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Editar';
    editBtn.className = 'w3-button w3-blue w3-small';
    editBtn.addEventListener('click', () => fillForm(student));
  
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Borrar';
    deleteBtn.className = 'w3-button w3-red w3-small w3-margin-left';
    deleteBtn.addEventListener('click', () => confirmDelete(student)); //ahora recibe el student completo, para saber el count de asignaciones
  
    td.appendChild(editBtn);
    td.appendChild(deleteBtn);
    return td;
}
  
function fillForm(student)
{
    document.getElementById('studentId').value = student.id;
    document.getElementById('fullname').value = student.fullname;
    document.getElementById('email').value = student.email;
    document.getElementById('age').value = student.age;
}

//cierre
function setupModalControls()
{
    const closeModalBtn = document.getElementById('closeErrorModalBtn');
    const closeModalCross = document.getElementById('closeErrorModalCross');
    
    closeModalBtn.addEventListener('click', () => hideErrorModal());
    closeModalCross.addEventListener('click', () => hideErrorModal());
}

//recibe un mensaje y muestra el modal con ese mensaje
function showErrorModal(message)
{
    const modalMessage = document.getElementById('errorModalMessage');
    modalMessage.textContent = message;
    errorModal.style.display = 'block';
}

function hideErrorModal()
{
    errorModal.style.display = 'none';
}

//recibe todo el student y lo elimina si no tiene materias
async function confirmDelete(student) 
{
    // tengo que verificar devuelta en el front
    if (student.subject_count > 0) 
    {
        const message = `No se puede eliminar a "${student.fullname}" porque tiene ${student.subject_count} materia(s) asignada(s).`;
        showErrorModal(message);
        return; 
    }
  
    // confirmamos que se quiere borrar
    if (!confirm(`¿Estás seguro que deseas borrar a "${student.fullname}"? Esta acción no se puede deshacer.`)) return;
  
    // 3. si se confrima, eliminamos
    try 
    {
        await studentsAPI.remove(student.id);
        loadStudents();
    } 
    catch (err) 
    {
        //error de servidor (por las duadas)
        console.error('Error al borrar:', err.message);
        showErrorModal(`Error del servidor al intentar borrar: ${err.message}`);
    }
}
  