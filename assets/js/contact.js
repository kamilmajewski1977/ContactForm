(function () {
    const form = document.getElementById('contactForm');
    if (!form) {
        return;
    }

    const statusBox = document.getElementById('formStatus');
    const submitButton = form.querySelector('.submit-btn');

    const validators = {
        name(value) {
            if (!value.trim()) {
                return 'Proszę podać imię i nazwisko.';
            }
            if (value.trim().length < 3) {
                return 'Imię i nazwisko musi mieć co najmniej 3 znaki.';
            }
            return '';
        },
        email(value) {
            if (!value.trim()) {
                return 'Proszę podać adres e-mail.';
            }
            const pattern = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;
            if (!pattern.test(value)) {
                return 'Wprowadź poprawny adres e-mail.';
            }
            return '';
        },
        phone(value) {
            if (!value.trim()) {
                return 'Proszę podać numer telefonu.';
            }
            const pattern = /^[+]?[(]?[0-9]{1,4}[)]?[0-9\s-]{5,}$/;
            if (!pattern.test(value)) {
                return 'Wprowadź poprawny numer telefonu.';
            }
            return '';
        },
        message(value) {
            if (!value.trim()) {
                return 'Napisz wiadomość.';
            }
            if (value.trim().length < 10) {
                return 'Wiadomość musi mieć co najmniej 10 znaków.';
            }
            return '';
        }
    };

    const setFieldState = (fieldWrapper, message) => {
        const errorBox = fieldWrapper.querySelector('.error-message');
        if (message) {
            fieldWrapper.classList.remove('valid');
            fieldWrapper.classList.add('invalid');
            if (errorBox) {
                errorBox.textContent = message;
            }
        } else {
            fieldWrapper.classList.remove('invalid');
            fieldWrapper.classList.add('valid');
            if (errorBox) {
                errorBox.textContent = '';
            }
        }
    };

    const validateField = (name, value) => {
        if (typeof validators[name] !== 'function') {
            return '';
        }
        return validators[name](value);
    };

    const toggleStatus = (message, isSuccess) => {
        if (!statusBox) {
            return;
        }
        statusBox.textContent = message;
        statusBox.classList.remove('is-success', 'is-error', 'is-visible');
        if (message) {
            statusBox.classList.add('is-visible');
            statusBox.classList.add(isSuccess ? 'is-success' : 'is-error');
        }
    };

    const applyServerErrors = (errors) => {
        if (!errors || typeof errors !== 'object') {
            return;
        }
        Object.entries(errors).forEach(([name, message]) => {
            const fieldWrapper = form.querySelector(`.form-group[data-field="${name}"]`);
            if (!fieldWrapper) {
                return;
            }
            setFieldState(fieldWrapper, String(message));
        });
    };

    form.addEventListener('input', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
            return;
        }
        const fieldWrapper = target.closest('.form-group');
        if (!fieldWrapper) {
            return;
        }
        const errorMessage = validateField(target.name, target.value);
        setFieldState(fieldWrapper, errorMessage);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        let isValid = true;

        form.querySelectorAll('.form-group').forEach((group) => {
            const input = group.querySelector('input, textarea');
            if (!input) {
                return;
            }
            const { name, value } = input;
            const errorMessage = validateField(name, value);
            setFieldState(group, errorMessage);
            if (errorMessage) {
                isValid = false;
            }
        });

        if (!isValid) {
            toggleStatus('Uzupełnij poprawnie wszystkie pola formularza.', false);
            return;
        }

        toggleStatus('Wysyłanie wiadomości...', true);
        if (submitButton) {
            submitButton.disabled = true;
        }

        const formData = new FormData(form);

        fetch(form.getAttribute('action'), {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
            .then(async (response) => {
                const payload = await response.json().catch(() => ({ status: 'error', message: 'Nieoczekiwana odpowiedź serwera.' }));
                if (!response.ok || payload.status !== 'success') {
                    const error = new Error(payload.message || 'Nie udało się wysłać wiadomości.');
                    error.details = payload.errors || null;
                    throw error;
                }
                return payload;
            })
            .then((payload) => {
                toggleStatus(payload.message || 'Wiadomość została wysłana.', true);
                form.reset();
                form.querySelectorAll('.form-group').forEach((group) => {
                    group.classList.remove('valid', 'invalid');
                    const errorBox = group.querySelector('.error-message');
                    if (errorBox) {
                        errorBox.textContent = '';
                    }
                });
            })
            .catch((error) => {
                toggleStatus(error.message || 'Nie udało się wysłać wiadomości.', false);
                if (error && typeof error === 'object' && 'details' in error) {
                    applyServerErrors(error.details);
                }
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            });
    });
})();
