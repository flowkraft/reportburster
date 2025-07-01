Java Requirement
--------------
ReportBurster requires Java version 11 specifically to run properly.

Note 1: ReportBurster will not work with Java versions before 11 and is not guaranteed to work with versions after 11.
Note 2: Before installing, uninstalling, or changing Java versions, please verify that no other business-critical software on your computer depends on Java. Modifying Java installations may affect or break other Java-dependent applications.

Check Current Installation
-------------------------
1. Check if Java 11 is already installed:
   - Open PowerShell
   - Run:
   
   java -version
   
   If you see "version 11.x.x", Java 11 is already installed - no further action needed.
   If Java 11 is not installed, Chocolatey (Windows) package manager provides an easy way to install it.

2. Check if Chocolatey is installed:
   - In the same PowerShell window
   - Run:
   
   choco -v
   
   If you see a version number, Chocolatey is installed - skip to "Install Java 11".
   If you get an error, continue with "Install Chocolatey" below.

Installation Instructions
------------------------
1. Install Chocolatey Package Manager:
   - Open PowerShell as Administrator
   - Run this command:
   
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   
   Source: https://chocolatey.org/install
   - Close PowerShell

2. Install Java 11:
   - Open a new PowerShell window as Administrator
   - Run:
   
   choco install temurin11 --yes

Uninstallation (if needed)
-------------------------
To remove Java 11:
- Open PowerShell as Administrator
- Run:

choco uninstall temurin11 --yes