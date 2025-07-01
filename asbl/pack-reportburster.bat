IF EXIST dist (
	del /S /Q dist\*
	RMDIR /S /Q dist
)

IF EXIST target (
	del /S /Q target\*
	RMDIR /S /Q target
)

IF EXIST pack-reportburster.log (del /f /q pack-reportburster.log)

mvn clean test -Dtest=AssemblerTest#assembleReportBursterAndReportBursterServer -X > pack-reportburster.log

:: cd src/uat
:: call run-tests.bat > uat-tests.log