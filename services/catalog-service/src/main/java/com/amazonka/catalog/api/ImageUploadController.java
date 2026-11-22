package com.amazonka.catalog.api;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.amazonka.common.exception.ApiErrorCode;
import com.amazonka.common.exception.ApiException;
import com.amazonka.common.security.JwtPrincipal;

/**
 * Subida de imágenes para el panel de administración, con el mismo patrón que
 * el CRM de clientes: el formulario envía el archivo (multipart) o una URL.
 * El archivo se guarda en disco y la URL devuelta se guarda en el producto.
 */
@RestController
@RequestMapping("/api/catalog/uploads")
public class ImageUploadController {

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private static final Map<String, String> EXTENSION_BY_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private final Path storageDir;

    public ImageUploadController(
            @Value("${app.upload.image-dir:./uploads/products}") String imageDir) {
        this.storageDir = Path.of(imageDir).toAbsolutePath().normalize();
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {

        requireAdmin(jwt);

        if (file == null || file.isEmpty()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    ApiErrorCode.DATOS_INVALIDOS,
                    "Selecciona una imagen");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    ApiErrorCode.ARCHIVO_DEMASIADO_GRANDE,
                    "La imagen no puede superar los 5 MB");
        }

        String contentType = file.getContentType() == null
                ? ""
                : file.getContentType().toLowerCase(Locale.ROOT);
        String extension = EXTENSION_BY_TYPE.get(contentType);
        if (extension == null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    ApiErrorCode.DATOS_INVALIDOS,
                    "Formato no soportado. Usa JPG, PNG, WEBP o GIF");
        }

        String filename = UUID.randomUUID() + extension;

        try {
            Files.createDirectories(storageDir);
            Files.copy(file.getInputStream(), storageDir.resolve(filename));
        } catch (IOException exception) {
            throw new ApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ApiErrorCode.ERROR_INTERNO,
                    "No se pudo guardar la imagen");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "filename", filename,
                        "url", "/api/catalog/uploads/image/" + filename));
    }

    @GetMapping("/image/{filename}")
    public ResponseEntity<Resource> image(@PathVariable String filename) {
        if (!filename.matches("[0-9a-f-]{36}\\.(jpg|png|webp|gif)")) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    ApiErrorCode.NO_ENCONTRADO,
                    "Imagen no encontrada");
        }

        Path file = storageDir.resolve(filename).normalize();
        if (!file.startsWith(storageDir) || !Files.isRegularFile(file)) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    ApiErrorCode.NO_ENCONTRADO,
                    "Imagen no encontrada");
        }

        MediaType type = switch (filename.substring(filename.lastIndexOf('.'))) {
            case ".png" -> MediaType.IMAGE_PNG;
            case ".webp" -> MediaType.parseMediaType("image/webp");
            case ".gif" -> MediaType.IMAGE_GIF;
            default -> MediaType.IMAGE_JPEG;
        };

        return ResponseEntity.ok()
                .contentType(type)
                .header("Cache-Control", "public, max-age=86400")
                .body(new FileSystemResource(file));
    }

    private void requireAdmin(Jwt jwt) {
        if (jwt == null) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    ApiErrorCode.NO_AUTORIZADO,
                    "Autenticación requerida");
        }
        if (!JwtPrincipal.from(jwt).isAdmin()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    ApiErrorCode.PROHIBIDO,
                    "Solo un administrador puede subir imágenes");
        }
    }
}
