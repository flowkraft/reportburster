/*
 * Copyright 2009-2010 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.sourcekraft.batch.admin.web.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.admin.service.FileInfo;
import org.springframework.batch.admin.service.FileService;
import org.springframework.core.io.Resource;
import org.springframework.ui.ModelMap;
import org.springframework.util.FileCopyUtils;
import org.springframework.validation.Errors;
import org.springframework.web.multipart.MultipartFile;

public class UploadController {

    private static Logger logger = LoggerFactory.getLogger(UploadController.class);

    private FileService fileService;

    /**
     * The service used to manage file lists and uploads.
     * 
     * @param fileService
     *            the {@link FileService} to set
     */
    public void setFileService(FileService fileService) {
        this.fileService = fileService;
    }

    public String upload(String path, MultipartFile file, ModelMap model, int startFile, int pageSize, Date date,
            Errors errors, String redirect) throws Exception {

        if (file.isEmpty()) {
            errors.reject("file.upload.empty", new Object[]{file.getOriginalFilename()},
                    "File upload was empty for filename=[" + file.getOriginalFilename() + "]");
            list(model, startFile, pageSize);
            return "files";
        }

        try {
            FileInfo dest = fileService.createFile(path + "/" + file.getOriginalFilename());
            file.transferTo(fileService.getResource(dest.getPath()).getFile());
            fileService.publish(dest);
            model.put("uploaded", dest.getPath());
        } catch (IOException e) {
            errors.reject("file.upload.failed", new Object[]{file.getOriginalFilename()}, "File upload failed for "
                    + file.getOriginalFilename());
        } catch (Exception e) {
            String message = "File upload failed downstream processing for " + file.getOriginalFilename();
            if (logger.isDebugEnabled()) {
                logger.debug(message, e);
            } else {
                logger.info(message);
            }
            errors.reject("file.upload.failed.downstream", new Object[]{file.getOriginalFilename()}, message);
        }

        if (errors.hasErrors()) {
            list(model, startFile, pageSize);
            return "files";
        }

        return redirect;

    }

    public void list(ModelMap model, int startFile, int pageSize) throws Exception {

        List<FileInfo> files = fileService.getFiles(startFile, pageSize);
        Collections.sort(files);
        model.put("files", files);

    }

    public String get(HttpServletRequest request, HttpServletResponse response, ModelMap model, int startFile,
            int pageSize, Date date, Errors errors, String urlPath) throws Exception {

        list(model, startFile, pageSize);

        String path = request.getPathInfo().substring(urlPath.length());
        Resource file = fileService.getResource(path);
        if (file == null || !file.exists()) {
            errors.reject("file.download.missing", new Object[]{path}, "File download failed for missing file at path="
                    + path);
            return "files";
        }

        response.setContentType("application/octet-stream");
        try {
            FileCopyUtils.copy(file.getInputStream(), response.getOutputStream());
        } catch (IOException e) {
            errors.reject("file.download.failed", new Object[]{path}, "File download failed for path=" + path);
            logger.info("File download failed for path=" + path, e);
            return "files";
        }

        return null;

    }

    public String delete(ModelMap model, String pattern, String redirect) throws Exception {

        int deletedCount = fileService.delete(pattern);

        model.put("files", new ArrayList<String>());
        model.put("deletedCount", deletedCount);

        return redirect;

    }
}
