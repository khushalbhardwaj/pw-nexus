<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    die(json_encode(["success" => false, "message" => "No valid JSON data received."]));
}

// Update Quote
if (isset($data['quote'])) {
    $stmt = $conn->prepare("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'global_quote'");
    $stmt->bind_param("s", $data['quote']);
    $stmt->execute();
    $stmt->close();
}

// Update Team Members
foreach (['t1', 't2'] as $memberId) {
    if (isset($data[$memberId])) {
        $m = $data[$memberId];
        
        $stmt = $conn->prepare("UPDATE team_members SET 
            name=?, role=?, description=?, education=?, batch=?, 
            location=?, remote=?, birthday=?, age=?, project=?, 
            project_role=?, image_url=? 
            WHERE id=?");
            
        $stmt->bind_param("sssssssssssss", 
            $m['name'], $m['role'], $m['desc'], $m['edu'], $m['batch'], 
            $m['loc'], $m['remote'], $m['bday'], $m['age'], $m['proj'], 
            $m['projRole'], $m['image'], $memberId
        );
        $stmt->execute();
        $stmt->close();
    }
}

echo json_encode(["success" => true, "message" => "Data updated successfully."]);
$conn->close();
?>
