# Исправление ошибки jlink в Android Studio

## Проблема
`JdkImageTransform` / `jlink` — Android Studio использует Java 21, из-за чего возникает ошибка.

## Решение: указать JDK 17 в Android Studio

1. **File** → **Settings** (или **Ctrl+Alt+S**)
2. **Build, Execution, Deployment** → **Build Tools** → **Gradle**
3. В поле **Gradle JDK** выберите:
   - **17** (если в списке есть)
   - Или **Download JDK** → версия **17** → **Eclipse Temurin**
   - Или укажите путь: `C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot`
4. Нажмите **Apply** → **OK**
5. **File** → **Sync Project with Gradle Files**
6. Запустите приложение снова (**Run** или **Debug**)
