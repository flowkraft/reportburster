if (when == "nightly") {
	
	def ant = new AntBuilder()
	
	ant.copy(todir: "poll") {
		fileset(dir : "input-files/scheduled") { include(name:"**/*.*") }
	}
	
	ant.delete {
		fileset(dir : "input-files/scheduled") { include(name:"**/*.*") }
	}
	
}