# Diagram Architektury Autentykacji - Kanji Quiz

Ten diagram przedstawia pełny przepływ autentykacji w aplikacji Kanji Quiz, obejmujący rejestrację, logowanie, ochronę zasobów, odświeżanie tokenów i wylogowanie.

## Przepływ Autentykacji

<mermaid_diagram>

```mermaid
sequenceDiagram
    autonumber
    participant Przeglądarka
    participant Middleware
    participant Astro API
    participant Supabase Auth

    Note over Przeglądarka,Supabase Auth: PRZEPŁYW REJESTRACJI

    Przeglądarka->>Przeglądarka: Renderowanie SignUpForm
    Przeglądarka->>Przeglądarka: Walidacja danych
    Note right of Przeglądarka: Email format,<br/>Hasło 8+ znaków,<br/>Wielkie/małe/cyfry

    Przeglądarka->>Astro API: POST /api/auth/signup
    Note right of Przeglądarka: email, password,<br/>confirmPassword

    activate Astro API
    Astro API->>Astro API: Walidacja Zod schema
    Astro API->>Supabase Auth: authService.signUp()
    activate Supabase Auth

    alt Email już istnieje
        Supabase Auth-->>Astro API: Błąd 409 Conflict
        Astro API-->>Przeglądarka: EmailAlreadyExistsError
        Przeglądarka->>Przeglądarka: Wyświetl komunikat błędu
    else Rejestracja udana
        Supabase Auth->>Supabase Auth: Tworzenie użytkownika
        Note right of Supabase Auth: Zapisanie w auth.users<br/>Hash hasła bcrypt
        Supabase Auth->>Supabase Auth: Generowanie tokenów
        Note right of Supabase Auth: Access token JWT 1h<br/>Refresh token 7d
        Supabase Auth->>Supabase Auth: Ustawienie cookies
        Note right of Supabase Auth: HttpOnly, Secure,<br/>SameSite: Lax
        Supabase Auth-->>Astro API: userId, email, tokens
        deactivate Supabase Auth
        Astro API-->>Przeglądarka: 201 Created
        deactivate Astro API
        Przeglądarka->>Przeglądarka: Auto-logowanie
        Przeglądarka->>Przeglądarka: Redirect /dashboard
    end

    Note over Przeglądarka,Supabase Auth: PRZEPŁYW LOGOWANIA

    Przeglądarka->>Przeglądarka: Renderowanie SignInForm
    Przeglądarka->>Astro API: POST /api/auth/signin
    Note right of Przeglądarka: email, password

    activate Astro API
    Astro API->>Astro API: Walidacja Zod schema
    Astro API->>Supabase Auth: authService.signIn()
    activate Supabase Auth

    Supabase Auth->>Supabase Auth: Weryfikacja credentials
    Note right of Supabase Auth: Porównanie hasła<br/>z encrypted_password

    alt Nieprawidłowe dane
        Supabase Auth-->>Astro API: Błąd 401 Unauthorized
        Astro API-->>Przeglądarka: InvalidCredentialsError
        Przeglądarka->>Przeglądarka: Komunikat błędu
        Note right of Przeglądarka: Generyczny komunikat<br/>bez ujawniania<br/>istnienia konta
    else Logowanie udane
        Supabase Auth->>Supabase Auth: Generowanie tokenów
        Supabase Auth->>Supabase Auth: Ustawienie cookies
        Supabase Auth-->>Astro API: userId, email, tokens
        deactivate Supabase Auth
        Astro API-->>Przeglądarka: 200 OK
        deactivate Astro API
        Przeglądarka->>Przeglądarka: Redirect /dashboard
    end

    Note over Przeglądarka,Supabase Auth: OCHRONA ZASOBÓW I SESJA

    Przeglądarka->>Middleware: GET /dashboard
    activate Middleware

    Middleware->>Supabase Auth: getSession() z cookies
    activate Supabase Auth

    alt Access token ważny
        Supabase Auth-->>Middleware: Session z user data
        Middleware->>Middleware: Dodanie session do locals
        Note right of Middleware: locals.session<br/>locals.user
        Middleware->>Astro API: Przekazanie żądania
        activate Astro API
        Astro API->>Astro API: requireAuth() sprawdza user
        Astro API-->>Przeglądarka: 200 OK Dashboard HTML
        deactivate Astro API
        deactivate Middleware

    else Access token wygasł
        Supabase Auth->>Supabase Auth: Auto-odświeżanie tokenu
        Note right of Supabase Auth: Użycie refresh token<br/>z cookies
        Supabase Auth->>Supabase Auth: Generowanie nowego access
        Note right of Supabase Auth: Reuse interval 10s
        Supabase Auth->>Supabase Auth: Aktualizacja cookies
        Supabase Auth-->>Middleware: Odświeżona sesja
        Middleware->>Middleware: Aktualizacja locals
        Middleware->>Astro API: Przekazanie żądania
        activate Astro API
        Astro API-->>Przeglądarka: 200 OK Dashboard HTML
        deactivate Astro API
        deactivate Middleware

    else Brak sesji lub token nieważny
        Supabase Auth-->>Middleware: null
        deactivate Supabase Auth
        Middleware->>Middleware: locals.user = null
        Middleware->>Przeglądarka: Redirect /auth/signin
        Note right of Middleware: ?redirect=/dashboard
        deactivate Middleware
        Przeglądarka->>Przeglądarka: Wyświetl formularz logowania
    end

    Note over Przeglądarka,Supabase Auth: OCHRONA API ENDPOINTS

    Przeglądarka->>Middleware: POST /api/quizzes
    activate Middleware
    Middleware->>Supabase Auth: getSession()
    activate Supabase Auth

    alt Użytkownik zalogowany
        Supabase Auth-->>Middleware: Session z user data
        Middleware->>Middleware: Dodanie user do locals
        Middleware->>Astro API: Przekazanie żądania
        activate Astro API
        Astro API->>Astro API: requireAuthAPI(locals)
        Note right of Astro API: Sprawdzenie locals.user
        Astro API->>Astro API: Przetwarzanie żądania
        Note right of Astro API: QuizService.createQuiz<br/>z user.id
        Astro API-->>Przeglądarka: 201 Created quiz data
        deactivate Astro API
        deactivate Middleware

    else Brak autoryzacji
        Supabase Auth-->>Middleware: null
        deactivate Supabase Auth
        Middleware->>Middleware: locals.user = null
        Middleware->>Astro API: Przekazanie żądania
        activate Astro API
        Astro API->>Astro API: requireAuthAPI(locals)
        Astro API->>Astro API: Throw AuthenticationRequiredError
        Astro API-->>Przeglądarka: 401 Unauthorized
        deactivate Astro API
        deactivate Middleware
        Note right of Przeglądarka: code:<br/>AUTHENTICATION_REQUIRED
    end

    Note over Przeglądarka,Supabase Auth: PRZEPŁYW WYLOGOWANIA

    Przeglądarka->>Przeglądarka: Kliknięcie przycisku Logout
    Note right of Przeglądarka: W DashboardHeader

    Przeglądarka->>Astro API: POST /api/auth/signout
    activate Astro API
    Astro API->>Supabase Auth: authService.signOut()
    activate Supabase Auth

    Supabase Auth->>Supabase Auth: Usunięcie sesji
    Supabase Auth->>Supabase Auth: Czyszczenie cookies
    Note right of Supabase Auth: Usunięcie access i<br/>refresh token
    Supabase Auth-->>Astro API: Sukces
    deactivate Supabase Auth

    Astro API-->>Przeglądarka: 200 OK
    deactivate Astro API

    Przeglądarka->>Przeglądarka: Redirect /auth/signin
    Note right of Przeglądarka: Sesja zakończona<br/>Użytkownik wylogowany

    Note over Przeglądarka,Supabase Auth: MIDDLEWARE PRZY KAŻDYM ŻĄDANIU

    rect rgb(240, 248, 255)
        Note over Middleware: Middleware działa przy każdym żądaniu:<br/>1. Przechwytuje request<br/>2. Wywołuje supabase.auth.getSession()<br/>3. Weryfikuje access token<br/>4. Auto-odświeża jeśli wygasł<br/>5. Dodaje session i user do context.locals<br/>6. Przekazuje kontrolę do następnej warstwy
    end

    rect rgb(255, 250, 240)
        Note over Supabase Auth: Zarządzanie tokenami:<br/>Access Token: JWT, 1 godzina ważności<br/>Refresh Token: 7 dni ważności<br/>Cookies: HttpOnly, Secure, SameSite Lax<br/>Rotacja tokenów: Enabled<br/>Reuse interval: 10 sekund
    end
```

</mermaid_diagram>

## Kluczowe elementy architektury

### Aktorzy systemu

1. **Przeglądarka**: Renderuje komponenty React (SignInForm, SignUpForm), zarządza interakcją użytkownika, przechowuje cookies sesji
2. **Middleware**: Przechwytuje wszystkie żądania, weryfikuje sesję, dodaje dane użytkownika do context.locals
3. **Astro API**: Backend endpoints (/api/auth/\*), zarządza logiką biznesową przez AuthService, waliduje dane
4. **Supabase Auth**: Zarządza użytkownikami, sesjami, tokenami, automatycznie odświeża tokeny

### Przepływy autentykacji

1. **Rejestracja**: Walidacja → Utworzenie konta → Auto-logowanie → Redirect na dashboard
2. **Logowanie**: Weryfikacja credentials → Generowanie tokenów → Ustawienie cookies → Redirect
3. **Ochrona zasobów**: Weryfikacja sesji w middleware → Auto-odświeżanie tokenów → Dostęp lub redirect
4. **Ochrona API**: Sprawdzenie locals.user → Autoryzacja lub 401 Unauthorized
5. **Wylogowanie**: Usunięcie sesji → Czyszczenie cookies → Redirect na signin

### Bezpieczeństwo

- **Tokeny**: Access token JWT (1h), Refresh token (7d)
- **Cookies**: HttpOnly (ochrona przed XSS), Secure (tylko HTTPS), SameSite: Lax
- **Hasła**: Hashed przez bcrypt, min 8 znaków, wymóg wielkie/małe litery + cyfry
- **Rate limiting**: 5 rejestracji/h, 10 logowań/h
- **Błędy**: Generyczne komunikaty bez ujawniania istnienia kont

### Kluczowe komponenty

- **AuthService**: Centralna logika autentykacji
- **Auth Guards**: requireAuth(), requireGuest(), requireAuthAPI()
- **Middleware**: Automatyczna weryfikacja sesji przy każdym żądaniu
- **Walidacja**: Zod schemas dla wszystkich danych wejściowych
- **Error Classes**: Dedykowane klasy błędów (EmailAlreadyExistsError, InvalidCredentialsError, etc.)
