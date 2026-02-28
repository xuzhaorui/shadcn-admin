package com.shadcn.admin.backend.modules.monitor.jobs.service;

import com.shadcn.admin.backend.common.config.BackupProperties;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.stereotype.Component;

@Component("dataBackupJobBean")
public class DataBackupJobBean {
    private static final Logger log = LoggerFactory.getLogger(DataBackupJobBean.class);
    private static final DateTimeFormatter TS_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private final DataSourceProperties dataSourceProperties;
    private final BackupProperties backupProperties;

    public DataBackupJobBean(DataSourceProperties dataSourceProperties, BackupProperties backupProperties) {
        this.dataSourceProperties = dataSourceProperties;
        this.backupProperties = backupProperties;
    }

    public void backup() {
        DbInfo db = parseMysqlJdbcUrl(require(dataSourceProperties.getUrl(), "spring.datasource.url"));
        String username = require(dataSourceProperties.getUsername(), "spring.datasource.username");
        String password = dataSourceProperties.getPassword() == null ? "" : dataSourceProperties.getPassword();

        Path outputDir = Path.of(require(backupProperties.getOutputDir(), "app.backup.output-dir"));
        try {
            Files.createDirectories(outputDir);
        } catch (IOException ex) {
            throw new IllegalStateException("failed to create backup directory: " + outputDir, ex);
        }

        String filename = db.database() + "_" + TS_FORMATTER.format(LocalDateTime.now()) + ".sql";
        Path outputFile = outputDir.resolve(filename);

        List<String> cmd = new ArrayList<>();
        cmd.add(require(backupProperties.getMysqldumpExecutable(), "app.backup.mysqldump-executable"));
        cmd.add("--host=" + db.host());
        cmd.add("--port=" + db.port());
        cmd.add("--user=" + username);
        cmd.add("--default-character-set=utf8mb4");
        cmd.add("--single-transaction");
        cmd.add("--routines");
        cmd.add("--events");
        cmd.add("--triggers");
        cmd.add("--databases");
        cmd.add(db.database());

        ProcessBuilder processBuilder = new ProcessBuilder(cmd);
        if (!password.isBlank()) {
            processBuilder.environment().put("MYSQL_PWD", password);
        }
        processBuilder.redirectOutput(outputFile.toFile());

        try {
            Process process = processBuilder.start();
            int exitCode = process.waitFor();
            String error = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            if (exitCode != 0) {
                throw new IllegalStateException("mysqldump failed with exitCode=" + exitCode + ", error=" + error);
            }
            log.info("data backup finished: {}", outputFile.toAbsolutePath());
        } catch (IOException ex) {
            throw new IllegalStateException("failed to start mysqldump process", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("data backup interrupted", ex);
        }
    }

    private String require(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(fieldName + " is required");
        }
        return value.trim();
    }

    private DbInfo parseMysqlJdbcUrl(String jdbcUrl) {
        final String prefix = "jdbc:mysql://";
        if (!jdbcUrl.startsWith(prefix)) {
            throw new IllegalStateException("unsupported datasource url: " + jdbcUrl);
        }
        String uriText = "mysql://" + jdbcUrl.substring(prefix.length());
        URI uri = URI.create(uriText);
        String host = uri.getHost();
        int port = uri.getPort() > 0 ? uri.getPort() : 3306;
        String path = uri.getPath();
        if (host == null || path == null || path.isBlank() || "/".equals(path)) {
            throw new IllegalStateException("invalid mysql datasource url: " + jdbcUrl);
        }
        String database = path.startsWith("/") ? path.substring(1) : path;
        if (database.isBlank()) {
            throw new IllegalStateException("database name is missing in datasource url: " + jdbcUrl);
        }
        return new DbInfo(host, port, database);
    }

    private record DbInfo(String host, int port, String database) {}
}
