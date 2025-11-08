# ContactForm

Implementacja formularza kontaktowego z walidacją JavaScript i wysyłką wiadomości przez PHPMailer na dwa niezależne adresy przy użyciu szablonów HTML oraz tekstowych.

## Szybki start

1. Zainstaluj zależności PHP (PHPMailer):
   ```bash
   composer require phpmailer/phpmailer
   ```
2. Skonfiguruj dane serwera SMTP oraz adresy odbiorców w pliku [`public/send_contact.php`](public/send_contact.php).
3. Udostępnij katalog `public/` za pomocą serwera WWW (np. `php -S localhost:8000 -t public`).
4. Wypełnij formularz i wyślij wiadomość – wysyłka odbywa się w tle (bez przeładowania strony).

## Struktura

- `public/index.html` – formularz oraz wiadomości o statusie wysyłki.
- `assets/js/contact.js` – walidacja i asynchroniczne wysyłanie danych.
- `assets/css/contact.css` – podstawowe style formularza.
- `public/send_contact.php` – obsługa żądania i wysyłka wiadomości (dwa szablony, dwa adresy).
- `templates/*.php` – szablony wiadomości w wersji HTML oraz tekstowej.
