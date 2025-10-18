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

    // --- INICIO DE LA MODIFICACIÓN ---
    // 1. Validación de datos de entrada
    if (!isset($input['fullname']) || !isset($input['email']) || !isset($input['age']) || empty(trim($input['fullname']))) {
        http_response_code(400); // 400 Bad Request: significa que la petición del cliente es incorrecta
        echo json_encode(["error" => "Datos incompletos o inválidos. Se requiere nombre completo, email y edad."]);
        return;
    }

    $result = createStudent($conn, $input['fullname'], $input['email'], $input['age']);
    if ($result['inserted'] > 0) 
    {
        // 2. Usar el código HTTP 201 (Created) que es el estándar para una creación exitosa
        http_response_code(201); 
        echo json_encode(["message" => "Estudiante agregado correctamente", "id" => $result['id']]);
    } 
    else 
    {
        http_response_code(500); // 500 Internal Server Error
        // 3. Mensaje de error más descriptivo
        echo json_encode(["error" => "No se pudo agregar el estudiante. Es posible que el email ya exista."]);
    }
    // --- FIN DE LA MODIFICACIÓN ---
}

function handlePut($conn) 
{
    $input = json_decode(file_get_contents("php://input"), true);

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

    $result = deleteStudent($conn, $input['id']);
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