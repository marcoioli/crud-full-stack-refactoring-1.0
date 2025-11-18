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
        $subject = getSubjectById($conn, $_GET['id']);
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
    
    // Obtener el ID de la materia desde el cuerpo de la solicitud JSON
    $input = json_decode(file_get_contents("php://input"), true);
    $subject_id = $input['id'] ?? null;
    
    if (!$subject_id) {
        http_response_code(400); // Bad Request
        echo json_encode(["error" => "ID de materia no proporcionado."]);
        return;
    }

    // VALIDACIÓN DE ASIGNACIONES (studentsSubjects)
    try {
        // Consulta SQL para verificar si la materia está vinculada
        // Nota: Asegúrate que la tabla se llame 'students_subjects' en tu DB. 
        // En el script inicial dice 'students_subjects', pero aquí decía 'studentsSubjects'. 
        // Lo corregí a 'students_subjects' para mayor seguridad.
        $check_query = "SELECT COUNT(*) AS count FROM students_subjects WHERE subject_id = ?";
        $stmt_check = $conn->prepare($check_query);
        
        if ($stmt_check === false) {
             http_response_code(500);
             echo json_encode(["error" => "Error interno al preparar la consulta de verificación."]);
             return;
        }
        
        $stmt_check->bind_param("i", $subject_id);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        $row = $result_check->fetch_assoc();
        $assignments_count = $row['count'];
        $stmt_check->close();

        if ($assignments_count > 0) {
            // Detener la eliminación y retornar 409 Conflict
            http_response_code(409); 
            echo json_encode([
                "error" => "No se puede eliminar la materia.",
                "message" => "La materia tiene " . $assignments_count . " asignación(es) activa(s). Debe eliminarlas primero.",
                "type" => "assignment_conflict"
            ]);
            return;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Error del servidor al verificar la integridad de datos."]);
        return;
    }
    
    // Si NO HAY asignaciones, procede con el borrado.
    $result = deleteSubject($conn, $subject_id); 
    
    if ($result['deleted'] > 0) 
    {
        echo json_encode(["message" => "Materia eliminada correctamente"]);
    } 
    else 
    {
        http_response_code(404);
        echo json_encode(["error" => "No se pudo eliminar: Materia no encontrada."]);
    }
}
