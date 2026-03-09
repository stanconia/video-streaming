package com.videostreaming.shared.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;

@Service
public class S3Service {

    private static final Logger logger = LoggerFactory.getLogger(S3Service.class);

    private final String bucketName;
    private final boolean useLocalStorage;
    private final Path localStoragePath;
    private S3Client s3Client;
    private S3Presigner presigner;

    public S3Service(
            @Value("${aws.s3.recordings-bucket:}") String bucketName,
            @Value("${aws.region:us-east-1}") String region,
            @Value("${aws.s3.local-storage-path:#{null}}") String localPath) {

        this.bucketName = bucketName;

        if (localPath != null && !localPath.isEmpty()) {
            this.useLocalStorage = true;
            this.localStoragePath = Paths.get(localPath);
            logger.info("S3Service using LOCAL file storage at: {}", localStoragePath);
        } else {
            boolean localFallback = false;
            Path fallbackPath = null;
            try {
                Region awsRegion = Region.of(region);
                this.s3Client = S3Client.builder().region(awsRegion).build();
                this.presigner = S3Presigner.builder().region(awsRegion).build();
                // Quick check: try to use the client (will fail fast if no creds)
                s3Client.listBuckets();
                logger.info("S3Service connected to AWS S3, bucket={}", bucketName);
            } catch (Exception e) {
                logger.warn("S3 not available ({}), falling back to local file storage", e.getMessage());
                localFallback = true;
                fallbackPath = Paths.get(System.getProperty("java.io.tmpdir"), "edulive-local-s3");
            }
            this.useLocalStorage = localFallback;
            this.localStoragePath = fallbackPath;
        }

        if (useLocalStorage && localStoragePath != null) {
            try {
                Files.createDirectories(localStoragePath);
            } catch (IOException e) {
                logger.error("Failed to create local storage directory: {}", e.getMessage());
            }
        }
    }

    public void uploadFile(String key, byte[] data, String contentType) {
        if (useLocalStorage) {
            uploadLocal(key, data);
            return;
        }
        logger.info("Uploading to S3: bucket={}, key={}, size={} bytes", bucketName, key, data.length);
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();
        s3Client.putObject(request, RequestBody.fromBytes(data));
        logger.info("Upload complete: {}", key);
    }

    public String generatePresignedUrl(String key, int expirationSeconds) {
        if (useLocalStorage) {
            return generateLocalUrl(key);
        }
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expirationSeconds))
                .getObjectRequest(getObjectRequest)
                .build();
        String url = presigner.presignGetObject(presignRequest).url().toString();
        logger.debug("Generated presigned URL for key={}", key);
        return url;
    }

    private void uploadLocal(String key, byte[] data) {
        try {
            Path filePath = localStoragePath.resolve(key);
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, data);
            logger.info("Saved locally: {}", filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file locally: " + e.getMessage(), e);
        }
    }

    private String generateLocalUrl(String key) {
        return "/api/local-files/" + key;
    }

    public boolean isUsingLocalStorage() {
        return useLocalStorage;
    }

    public Path getLocalStoragePath() {
        return localStoragePath;
    }

    public String getBucketName() {
        return bucketName;
    }
}
