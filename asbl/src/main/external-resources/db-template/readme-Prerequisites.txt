Java Requirement
--------------
ReportBurster requires Java version 17 specifically to run properly.

Note 1: ReportBurster will not work with Java versions before 17 and is not guaranteed to work with versions after 17 (though it is likely to work).
Note 2: Before installing, uninstalling, or changing Java versions, please verify that no other business-critical software on your computer depends on Java. Modifying Java installations may affect or break other Java-dependent applications.

Check Current Installation
-------------------------
1. Check if Java 17 is already installed:
   - Open PowerShell
   - Run:
   
   java -version
   
   If you see "version 17.x.x", Java 17 is already installed - no further action needed.
   If Java 17 is not installed, Chocolatey (Windows) package manager provides an easy way to install it.

2. Check if Chocolatey is installed:
   - In the same PowerShell window
   - Run:
   
   choco -v
   
   If you see a version number, Chocolatey is installed - skip to "Install Java 17".
   If you get an error, continue with "Install Chocolatey" below.

Installation Instructions
------------------------
1. Install Chocolatey Package Manager:
   - Open PowerShell as Administrator
   - Run this command:
   
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   
   Source: https://chocolatey.org/install
   - Close PowerShell

2. Install Java 17:
   - Open a new PowerShell window as Administrator
   - Run:
   
   choco install temurin17 --yes

Uninstallation (if needed)
-------------------------
To remove Java 17:
- Open PowerShell as Administrator
- Run:

choco uninstall temurin17 --yes