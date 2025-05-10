$env:PGPASSWORD="monkey2123"
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

function Invoke-Psql {
    param(
        [Parameter(Position=0, Mandatory=$false)]
        [string]$command = "",
        [Parameter(Position=1, Mandatory=$false)]
        [string]$database = "jackerbox"
    )
    
    if ($command -eq "") {
        & $psqlPath -U postgres -d $database
    } else {
        & $psqlPath -U postgres -d $database -c $command
    }
}

# Export the function so it can be used from the command line
Export-ModuleMember -Function Invoke-Psql 