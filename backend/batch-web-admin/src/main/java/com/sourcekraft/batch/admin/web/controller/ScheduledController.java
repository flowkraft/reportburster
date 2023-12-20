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

import java.util.Date;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.validation.Errors;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@Controller
public class ScheduledController extends UploadController {

    @RequestMapping(value = "/scheduled", method = RequestMethod.POST)
    public String uploadRequest(@RequestParam
    String path, @RequestParam
    MultipartFile file, ModelMap model, @RequestParam(defaultValue = "0")
    int startFile, @RequestParam(defaultValue = "20")
    int pageSize, @ModelAttribute("date")
    Date date, Errors errors) throws Exception {
        return upload(path, file, model, startFile, pageSize, date, errors);
    }

    @RequestMapping(value = "/scheduled/{path}", method = RequestMethod.POST)
    public String upload(@PathVariable
    String path, @RequestParam
    MultipartFile file, ModelMap model, @RequestParam(defaultValue = "0")
    int startFile, @RequestParam(defaultValue = "20")
    int pageSize, @ModelAttribute("date")
    Date date, Errors errors) throws Exception {

        return super.upload(path, file, model, startFile, pageSize, date, errors, "redirect:scheduled");

    }

    @RequestMapping(value = "/scheduled", method = RequestMethod.GET)
    public void list(ModelMap model, @RequestParam(defaultValue = "0")
    int startFile, @RequestParam(defaultValue = "20")
    int pageSize) throws Exception {

        super.list(model, startFile, pageSize);

    }

    @RequestMapping(value = "/scheduled/**", method = RequestMethod.GET)
    public String get(HttpServletRequest request, HttpServletResponse response, ModelMap model,
            @RequestParam(defaultValue = "0")
            int startFile, @RequestParam(defaultValue = "20")
            int pageSize, @ModelAttribute("date")
            Date date, Errors errors) throws Exception {
        return super.get(request, response, model, startFile, pageSize, date, errors, "/scheduled/");
    }

    @RequestMapping(value = "/scheduled", method = RequestMethod.DELETE)
    public String delete(ModelMap model, @RequestParam(defaultValue = "**")
    String pattern) throws Exception {

        return super.delete(model, pattern, "redirect:scheduled");

    }

}
