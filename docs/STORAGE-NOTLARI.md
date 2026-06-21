# Storage Notları

- Talep görselleri `ilanlar/{uid}/talep_` prefix'i altında tutulur. İleride `ilanlar/{uid}/` cascade delete yazılırsa `talep_` prefix'li dosyalar orphan/yanlış silinme riski taşır — temizlik mantığı prefix'i ayırt etmeli.
