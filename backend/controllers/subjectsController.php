<?php
/**
*    File        : backend/controllers/subjectsController.php
*    Project     : CRUD PHP
*    Author      : Tecnologías Informáticas B - Facultad de Ingeniería - UNMdP
*    License     : http://www.gnu.org/licenses/gpl.txt  GNU GPL 3.0
*    Date        : Mayo 2025
*    Status      : Prototype
*    Iteration   : 3.0 ( prototype )
*/

require_once("./repositories/subjects.php");


function handleGet($conn) 
{
    if (isset($_GET['id'])) 
    {
        $subjet = getSubjectById($conn, $_GET['id']);
        echo json_encode($subject);
    } 
    //2.0
    else if (isset($_GET['page']) && isset($_GET['limit'])) 
    {
        $page = (int)$_GET['page'];
        $limit = (int)$_GET['limit'];
        $offset = ($page - 1) * $limit;

        $subjects = getPaginatedSubjects($conn, $limit, $offset);
        $total = getTotalSubjects($conn);

        echo json_encode([
            'subjects' => $subjects, // ya es array
            'total' => $total        // ya es entero
        ]);
    }
    else
    {
        $subjects = getAllSubjects($conn); // ya es array
        echo json_encode($subjects);
    }
}


function handlePost($conn) 
{
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['name']) || empty(trim($input['name'])))
    {
        http_response_code(400); // Bad Request
        echo json_encode(["error" => "El nombre de la materia es obligatorio."]);
        return;
    }

    $existingSubject = getSubjectByName($conn, $input['name']);
    if ($existingSubject) 
    {
        http_response_code(409);
        echo json_encode(["error" => "La materia con ese nombre ya existe."]);
        return;
    }

    $result = createSubject($conn, $input['name']);
    if ($result['inserted'] > 0) 
    {
        echo json_encode(["message" => "Materia creada correctamente"]);
    } 
    else 
    {
        http_response_code(500);
        echo json_encode(["error" => "No se pudo crear"]);
    }
}

function handlePut($conn) 
{
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['name']) || empty(trim($input['name'])))
    {
        http_response_code(400); // Bad Request
        echo json_encode(["error" => "El nombre de la materia es obligatorio."]);
        return;
    }
    
    
    $existingSubject = getSubjectByName($conn, $input['name']);
    if ($existingSubject && $existingSubject['id'] != $input['id']) 
    {
        
        http_response_code(409);
        echo json_encode(["error" => "Ya existe otra materia con ese nombre."]);
        return;
    }

    $result = updateSubject($conn, $input['id'], $input['name']);
    if ($result['updated'] > 0) 
    {
        echo json_encode(["message" => "Materia actualizada correctamente"]);
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
    
    $result = deleteSubject($conn, $input['id']);
    if ($result['deleted'] > 0) 
    {
        echo json_encode(["message" => "Materia eliminada correctamente"]);
    } 
    else 
    {
        http_response_code(500);
        echo json_encode(["error" => "No se pudo eliminar"]);
    }
}
?>