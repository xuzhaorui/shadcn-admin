package com.shadcn.admin.backend.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.backup")
public class BackupProperties {
    private String outputDir = "backups/sql";
    private String mysqldumpExecutable = "mysqldump";

    public String getOutputDir() {
        return outputDir;
    }

    public void setOutputDir(String outputDir) {
        this.outputDir = outputDir;
    }

    public String getMysqldumpExecutable() {
        return mysqldumpExecutable;
    }

    public void setMysqldumpExecutable(String mysqldumpExecutable) {
        this.mysqldumpExecutable = mysqldumpExecutable;
    }
}
