/*
    DocumentBurster is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    DocumentBurster is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with DocumentBurster.  If not, see <http://www.gnu.org/licenses/>
 */
package com.sourcekraft.documentburster.job;

import java.io.File;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Marshaller;
import jakarta.xml.bind.Unmarshaller;

import com.sourcekraft.documentburster.job.model.JobDetails;
import com.sourcekraft.documentburster.job.model.JobProgressDetails;

public class JobUtils {

	public static void saveJobDetails(JobDetails jobDetails, String jobFilePath) throws Exception {

		JAXBContext jc = JAXBContext.newInstance(JobDetails.class);

		Marshaller m = jc.createMarshaller();
		m.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);

		m.marshal(jobDetails, new File(jobFilePath));

	}

	public static void saveJobProgressDetails(JobProgressDetails jobProgressDetails, String jobProgressFilePath)
			throws Exception {

		JAXBContext jc = JAXBContext.newInstance(JobProgressDetails.class);

		Marshaller m = jc.createMarshaller();
		m.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);

		//this "created" trick is done because sometimes (very rarely but it happens) a simple 
		//m.marshal call fails with 105421439.progress (Access is denied) exception
		boolean created = false;

		do {

			try {
				m.marshal(jobProgressDetails, new File(jobProgressFilePath));
				created = true;
			} catch (Exception e) {
				created = false;
				Thread.sleep(10);
			}
		} while (!created);

	}

	public static JobProgressDetails loadJobProgressFile(String jobProgressFilePath) throws Exception {

		JAXBContext jc = JAXBContext.newInstance(JobProgressDetails.class);

		Unmarshaller u = jc.createUnmarshaller();

		JobProgressDetails jobProgressDetails = (JobProgressDetails) u.unmarshal(new File(jobProgressFilePath));

		return jobProgressDetails;

	}

}
