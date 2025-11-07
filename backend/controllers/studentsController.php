<?php
/**
*    File        : backend/controllers/studentsController.php
*    Project     : CRUD PHP
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Mayo 2025
*    Status      : Prototype
*    Iteration   : 3.0 ( prototype )
*/

require_once("./repositories/students.php");

require_once("./repositories/studentsSubjects.php");
//validacion 4
//para poder usar la funcion que cuenta cantidad de materias 

function handleGet($conn) 
{
    if (isset($_GET['id'])) 
    {
        $student = getStudentById($conn, $_GET['id']);
        echo json_encode($student);
    } 
    //2.0
    else if (isset($_GET['page']) && isset($_GET['limit'])) 
    {
        $page = (int)$_GET['page'];
        $limit = (int)$_GET['limit'];
        $offset = ($page - 1) * $limit;

        $students = getPaginatedStudents($conn, $limit, $offset);
        $total = getTotalStudents($conn);

        echo json_encode([
            'students' => $students, // ya es array
            'total' => $total        // ya es entero
        ]);
    }
    else
    {
        $students = getAllStudents($conn); // ya es array
        echo json_encode($students);
    }
}

function handlePost($conn) 
{
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['fullname']) || !isset($input['email']) || !isset($input['age']) || empty(trim($input['fullname']))) {
        http_response_code(400); // peticion incorrecta
        echo json_encode(["error" => "Datos incompletos o inválidos. Se requiere nombre completo, email y edad."]);
        return;
    }
    $existingStudent = getStudentByEmail($conn, $input['email']);
    if ($existingStudent) {
        http_response_code(409); // 409 Conflict
        echo json_encode(["error" => "El email proporcionado ya está registrado en el sistema."]);
        return;
    }
    $result = createStudent($conn, $input['fullname'], $input['email'], $input['age']);
    if ($result['inserted'] > 0) 
    {
       
        http_response_code(201); 
        echo json_encode(["message" => "Estudiante agregado correctamente", "id" => $result['id']]);
    } 
    else 
    {
        http_response_code(500); 
        echo json_encode(["error" => "No se pudo agregar el estudiante"]);
    }
}

function handlePut($conn) 
{
    $input = json_decode(file_get_contents("php://input"), true);
    $studentId = $input['id'];
    $existingStudent = getStudentByEmail($conn, $input['email'], $studentId);
    if ($existingStudent) {
        http_response_code(409); // 409 Conflict
        echo json_encode(["error" => "El email proporcionado ya está registrado por otro estudiante."]);
        return;
    }

    $result = updateStudent($conn, $input['id'], $input['fullname'], $input['email'], $input['age']);
    if ($result['updated'] > 0) 
    {
        echo json_encode(["message" => "Actualizado correctamente"]);
    } 
    else 
    {
        http_response_code(500);
        echo json_encode(["error" => "No se pudo actualizar"]);
    }
}

function handleDelete($conn) 
{
    $input = json_decode(file_get_contents("php://input"), true);
    
    // 1. Verificar si el estudiante tiene asignaciones
    $studentId = $input['id'];
    $subjectCount = countSubjectsByStudentId($conn, $studentId);

    if ($subjectCount > 0) //si tiene mateiras, no elimino
    {
        http_response_code(409); 
        echo json_encode(["error" => "No se puede eliminar el estudiante porque tiene $subjectCount materia(s) asignada(s)."]);
        return; 
    }

    //si no tiene, borro
    $result = deleteStudent($conn, $studentId);
    if ($result['deleted'] > 0) 
    {
        echo json_encode(["message" => "Eliminado correctamente"]);
    } 
    else 
    {
        http_response_code(500);
        echo json_encode(["error" => "No se pudo eliminar"]);
    }
}
?>