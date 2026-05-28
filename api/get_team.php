<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require 'db_connect.php';

$response = [
    'quote' => '',
    't1' => [],
    't2' => []
];

// Fetch Quote
$quoteQuery = "SELECT setting_value FROM site_settings WHERE setting_key = 'global_quote'";
$quoteResult = $conn->query($quoteQuery);
if ($quoteResult->num_rows > 0) {
    $response['quote'] = $quoteResult->fetch_assoc()['setting_value'];
}

// Fetch Team Members
$teamQuery = "SELECT * FROM team_members";
$teamResult = $conn->query($teamQuery);
if ($teamResult->num_rows > 0) {
    while($row = $teamResult->fetch_assoc()) {
        $memberId = $row['id']; // 't1' or 't2'
        $response[$memberId] = [
            'name' => $row['name'],
            'role' => $row['role'],
            'desc' => $row['description'],
            'edu' => $row['education'],
            'batch' => $row['batch'],
            'loc' => $row['location'],
            'remote' => $row['remote'],
            'bday' => $row['birthday'],
            'age' => $row['age'],
            'proj' => $row['project'],
            'projRole' => $row['project_role'],
            'image' => $row['image_url']
        ];
    }
}

echo json_encode($response);
$conn->close();
?>
