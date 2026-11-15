# Финальная сборка документов РКНП (Windows + Microsoft Word):
#   1) статистика и графики  2) docx-документы и стенд  3) оглавление 12 пт, номера страниц, PDF.
# Запуск из корня репозитория:  powershell -File research/paper/finalize.ps1
$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"
Remove-Item Env:VX_RESULTS, Env:VX_OUT -ErrorAction SilentlyContinue
python research/analyze.py | Out-Null
python research/paper/arch.py | Out-Null
python research/paper/build_paper.py
python research/paper/build_defense.py
python research/paper/build_poster.py
$out = (Resolve-Path "research/paper/out").Path
$w = New-Object -ComObject Word.Application
$w.Visible = $false
foreach ($n in "Verix_научная_работа", "Verix_подготовка_к_защите", "Verix_дневник_исследования", "Verix_отзыв_руководителя_шаблон") {
  $d = $w.Documents.Open("$out\$n.docx")
  if ($d.TablesOfContents.Count -gt 0) {
    $toc = $d.TablesOfContents.Item(1); $toc.Update()
    $toc.Range.Font.Size = 12; $toc.Range.ParagraphFormat.SpaceAfter = 0; $toc.Range.ParagraphFormat.SpaceBefore = 0
    $toc.UpdatePageNumbers()
  }
  $d.Fields.Update() | Out-Null
  $d.Save(); $d.SaveAs2("$out\$n.pdf", 17)
  "{0}: {1} стр." -f $n, $d.ComputeStatistics(2)
  $d.Close(0)
}
$w.Quit()
