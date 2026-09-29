using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace WpfHello;

public partial class MainWindow : Window
{
    // Same page as spike/tauri-hello/ui/index.html, except the "ready" signal
    // goes through window.chrome.webview.postMessage instead of a Tauri command.
    private const string HelloHtml = """
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Hello</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 2rem; }
          </style>
        </head>
        <body>
          <h1>Hello</h1>
          <script>
            // Signal "ready" only after the first frame has actually been painted:
            // DOMContentLoaded -> rAF (frame scheduled) -> rAF (previous frame painted).
            document.addEventListener('DOMContentLoaded', function () {
              requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                  window.chrome.webview.postMessage('ready');
                });
              });
            });
          </script>
        </body>
        </html>
        """;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        Loaded -= OnLoaded;

        // Keep the WebView2 profile out of the publish folder, mirroring Tauri's
        // %LOCALAPPDATA%\<identifier>\EBWebView layout.
        string userDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "WpfHello");

        CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(
            browserExecutableFolder: null,
            userDataFolder: userDataFolder);

        await webView.EnsureCoreWebView2Async(environment);

        webView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
        webView.NavigateToString(HelloHtml);
    }

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        if (e.TryGetWebMessageAsString() == "ready")
        {
            Title = "READY";
        }
    }
}
