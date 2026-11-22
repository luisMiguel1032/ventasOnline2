package com.amazonka.auth.application;

import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.amazonka.auth.api.dto.AdminLoginRequest;
import com.amazonka.auth.api.dto.CustomerLoginRequest;
import com.amazonka.auth.api.dto.CustomerRegisterRequest;
import com.amazonka.auth.api.dto.LoginResponse;
import com.amazonka.auth.domain.Customer;
import com.amazonka.auth.domain.User;
import com.amazonka.auth.infrastructure.CustomerRepository;
import com.amazonka.auth.infrastructure.UserRepository;
import com.amazonka.common.exception.ApiErrorCode;
import com.amazonka.common.exception.ApiException;
import com.amazonka.common.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UUID defaultTenantId;

    public AuthService(
            UserRepository userRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.default-tenant-id}") UUID defaultTenantId) {

        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.defaultTenantId = defaultTenantId;
    }

    // ------------------------------------------------------------------
    // Personal administrativo
    // ------------------------------------------------------------------
    public LoginResponse adminLogin(AdminLoginRequest request) {

        UUID tenantId = request.tenantId() != null
                ? request.tenantId()
                : defaultTenantId;

        User user = userRepository
                .findByTenantIdAndLoginAndDeletedAtIsNull(
                        tenantId,
                        request.login()
                )
                .orElseThrow(AuthService::credencialesInvalidas);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw credencialesInvalidas();
        }

        if (user.getStatus() == null || user.getStatus() != 1) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    ApiErrorCode.USUARIO_DESHABILITADO,
                    "Usuario deshabilitado"
            );
        }

        String token = jwtService.generarToken(
                user.getId(),
                user.getTenantId(),
                "ADMIN",
                user.getLogin(),
                user.getName()
        );

        return response(token, user.getId(), user.getTenantId(),
                "ADMIN", user.getLogin(), user.getName());
    }

    // ------------------------------------------------------------------
    // Clientes de la tienda
    // ------------------------------------------------------------------
    public LoginResponse customerLogin(CustomerLoginRequest request) {

        String email = normalizeEmail(request.email());

        Customer customer = customerRepository
                .findByTenantIdAndEmailAndStatus(
                        defaultTenantId,
                        email,
                        (short) 1
                )
                .orElseThrow(AuthService::credencialesInvalidas);

        if (customer.getPassword() == null
                || !passwordEncoder.matches(request.password(), customer.getPassword())) {
            throw credencialesInvalidas();
        }

        String token = jwtService.generarToken(
                customer.getId(),
                customer.getTenantId(),
                "CUSTOMER",
                customer.getEmail(),
                customer.getName()
        );

        return response(token, customer.getId(), customer.getTenantId(),
                "CUSTOMER", customer.getEmail(), customer.getName());
    }

    @Transactional
    public LoginResponse register(CustomerRegisterRequest request) {

        String email = normalizeEmail(request.email());

        if (customerRepository.existsByTenantIdAndEmail(defaultTenantId, email)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ApiErrorCode.CONFLICTO,
                    "Ya existe una cuenta con ese email"
            );
        }

        Customer customer = new Customer();
        customer.setTenantId(defaultTenantId);
        customer.setName(request.name().trim());
        customer.setEmail(email);
        customer.setPhone(request.phone());
        customer.setDocumentType(blankToNull(request.documentType()));
        customer.setDocumentNumber(blankToNull(request.documentNumber()));
        customer.setAddress(blankToNull(request.address()));
        customer.setCity(blankToNull(request.city()));
        customer.setState(blankToNull(request.state()));
        customer.setCountry(blankToNull(request.country()));
        customer.setPostalCode(blankToNull(request.postalCode()));
        customer.setReference(blankToNull(request.reference()));
        customer.setCustomerType(blankToNull(request.customerType()));
        customer.setBusinessName(blankToNull(request.businessName()));
        customer.setTaxId(blankToNull(request.taxId()));
        customer.setPassword(passwordEncoder.encode(request.password()));
        customer.setStatus((short) 1);

        Customer saved = customerRepository.save(customer);

        String token = jwtService.generarToken(
                saved.getId(),
                saved.getTenantId(),
                "CUSTOMER",
                saved.getEmail(),
                saved.getName()
        );

        return response(token, saved.getId(), saved.getTenantId(),
                "CUSTOMER", saved.getEmail(), saved.getName());
    }

    private LoginResponse response(
            String token,
            UUID subjectId,
            UUID tenantId,
            String accountType,
            String login,
            String name) {

        return new LoginResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                subjectId,
                tenantId,
                accountType,
                login,
                name
        );
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private static ApiException credencialesInvalidas() {
        return new ApiException(
                HttpStatus.UNAUTHORIZED,
                ApiErrorCode.CREDENCIALES_INVALIDAS,
                "Credenciales incorrectas"
        );
    }
}
