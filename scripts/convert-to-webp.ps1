<#
Script PowerShell seguro para converter imagens no diretório atual para WebP usando cwebp (binário do Google) ou ImageMagick `magick`.
Não modifica arquivos originais — cria arquivos *.webp ao lado dos originais.

Requisitos (instalar antes de rodar):
- cwebp (Google WebP tools) - recomendado
  - choco install webp
  - ou baixar: https://developers.google.com/speed/webp/download
- ou ImageMagick (magick)
  - choco install imagemagick

Uso:
  - Abra PowerShell na pasta do projeto (onde estão as imagens) e rode:
      .\convert-to-webp.ps1

O script tentará usar `cwebp` primeiro e cairá para `magick` se não encontrar.
#>

$files = @('boll.gif','box.gif','final.gif','m4020.jpg','m4070.jpg','manutencao.jpg')

function Convert-With-Cwebp($inFile, $outFile){
    & cwebp -q 80 $inFile -o $outFile | Out-Null
}

function Convert-With-ImageMagick($inFile, $outFile){
    & magick convert $inFile -quality 80 $outFile | Out-Null
}

# Check availability
$cwebp = Get-Command cwebp -ErrorAction SilentlyContinue
$magick = Get-Command magick -ErrorAction SilentlyContinue

if(-not $cwebp -and -not $magick){
    Write-Host "Nenhuma ferramenta de conversão encontrada. Instale 'cwebp' (recomendado) ou 'ImageMagick' (magick)." -ForegroundColor Yellow
    exit 1
}

foreach($f in $files){
    if(Test-Path $f){
        $out = [System.IO.Path]::ChangeExtension($f, '.webp')
        if(Test-Path $out){
            Write-Host "$out já existe — pulando" -ForegroundColor Gray
            continue
        }
        Write-Host "Convertendo $f -> $out"
        try{
            if($cwebp){ Convert-With-Cwebp $f $out }
            elseif($magick){ Convert-With-ImageMagick $f $out }
            Write-Host "Criado: $out" -ForegroundColor Green
        }catch{
            Write-Host "Falha ao converter $f: $_" -ForegroundColor Red
        }
    }else{
        Write-Host "Arquivo não encontrado: $f" -ForegroundColor DarkYellow
    }
}

Write-Host "Conversão finalizada. Verifique visualmente os .webp antes de deploy." -ForegroundColor Cyan
