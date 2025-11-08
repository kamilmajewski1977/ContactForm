<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use RuntimeException;
use Throwable;

header('Content-Type: application/json; charset=utf-8');

$respond = static function (int $code, array $payload): never {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
};

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $respond(405, ['status' => 'error', 'message' => 'Niedozwolona metoda żądania.']);
}

$input = array_map(static fn ($value) => trim((string)($value ?? '')), [
    'name' => $_POST['name'] ?? '',
    'email' => $_POST['email'] ?? '',
    'phone' => $_POST['phone'] ?? '',
    'message' => $_POST['message'] ?? '',
]);

$validators = [
    'name' => static fn ($value) => $value !== '' && mb_strlen($value) >= 3,
    'email' => static fn ($value) => filter_var($value, FILTER_VALIDATE_EMAIL),
    'phone' => static fn ($value) => $value !== '' && preg_match('/^[+]?[(]?[0-9]{1,4}[)]?[0-9\\s-]{5,}$/', $value),
    'message' => static fn ($value) => $value !== '' && mb_strlen($value) >= 10,
];

$messages = [
    'name' => 'Imię i nazwisko musi mieć co najmniej 3 znaki.',
    'email' => 'Podaj poprawny adres e-mail.',
    'phone' => 'Podaj poprawny numer telefonu.',
    'message' => 'Wiadomość musi mieć co najmniej 10 znaków.',
];

$errors = [];
foreach ($validators as $field => $isValid) {
    if (!$isValid($input[$field])) {
        $errors[$field] = $messages[$field];
    }
}

if ($errors) {
    $respond(422, ['status' => 'error', 'message' => 'Formularz zawiera błędy.', 'errors' => $errors]);
}

require_once __DIR__ . '/../vendor/autoload.php';

$mailer = new PHPMailer(true);

try {
    $mailer->isSMTP();
    $mailer->Host = 'smtp.example.com';
    $mailer->SMTPAuth = true;
    $mailer->Username = 'noreply@example.com';
    $mailer->Password = 'super-secret-password';
    $mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mailer->Port = 587;
    $mailer->CharSet = 'UTF-8';

    $mailer->setFrom('noreply@example.com', 'Pensjonaty.Online');
    $mailer->addReplyTo($input['email'], $input['name']);
    $mailer->isHTML(true);

    $templateData = formatTemplateData($input);

    foreach ([
        ['email' => 'sales@example.com', 'name' => 'Dział sprzedaży', 'subject' => 'Nowa wiadomość z formularza kontaktowego', 'view' => 'admin-notification.html'],
        ['email' => 'hr@example.com', 'name' => 'Dział HR', 'subject' => 'Zgłoszenie z formularza kontaktowego', 'view' => 'team-notification.html'],
    ] as $message) {
        $mailer->clearAddresses();
        $mailer->addAddress($message['email'], $message['name']);
        $mailer->Subject = $message['subject'];
        $mailer->Body = renderTemplate($message['view'], $templateData);
        $mailer->send();
    }
} catch (Throwable) {
    $respond(500, ['status' => 'error', 'message' => 'Nie udało się wysłać wiadomości. Spróbuj ponownie później.']);
}

$respond(200, ['status' => 'success', 'message' => 'Wiadomość została wysłana.']);

function renderTemplate(string $template, array $data): string
{
    $path = __DIR__ . '/../templates/' . $template;
    $contents = @file_get_contents($path);

    if ($contents === false) {
        throw new RuntimeException(sprintf('Nie znaleziono szablonu: %s', $template));
    }

    $replacements = [];
    foreach ($data as $key => $value) {
        $replacements['{{ ' . $key . ' }}'] = $value;
    }

    return strtr($contents, $replacements);
}

function formatTemplateData(array $input): array
{
    $safe = static fn ($value) => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    return [
        'name' => $safe($input['name']),
        'email' => $safe($input['email']),
        'phone' => $safe($input['phone']),
        'phoneRaw' => (string)preg_replace('/[^0-9+]/', '', $input['phone']),
        'message' => nl2br($safe($input['message']), false),
        'unsubscribeUrl' => 'https://example.com/unsubscribe',
    ];
}
