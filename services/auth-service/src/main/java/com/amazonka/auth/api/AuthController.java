package com.amazonka.auth.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.amazonka.auth.api.dto.AdminLoginRequest;
import com.amazonka.auth.api.dto.CustomerLoginRequest;
import com.amazonka.auth.api.dto.CustomerRegisterRequest;
import com.amazonka.auth.api.dto.LoginResponse;
import com.amazonka.auth.api.dto.MeResponse;
import com.amazonka.auth.application.AuthService;
import com.amazonka.common.security.JwtPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/admin/login")
    public ResponseEntity<LoginResponse> adminLogin(
            @Valid @RequestBody AdminLoginRequest request) {

        return ResponseEntity.ok(authService.adminLogin(request));
    }

    @PostMapping("/customer/login")
    public ResponseEntity<LoginResponse> customerLogin(
            @Valid @RequestBody CustomerLoginRequest request) {

        return ResponseEntity.ok(authService.customerLogin(request));
    }

    @PostMapping("/customer/register")
    public ResponseEntity<LoginResponse> register(
            @Valid @RequestBody CustomerRegisterRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(
            @AuthenticationPrincipal Jwt jwt) {

        JwtPrincipal principal = JwtPrincipal.from(jwt);

        return ResponseEntity.ok(new MeResponse(
                principal.subjectId(),
                principal.tenantId(),
                principal.accountType(),
                principal.login(),
                principal.name()
        ));
    }
}
