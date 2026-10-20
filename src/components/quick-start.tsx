import { External } from "./shared";
import { repoUrl } from "../data/types";

/** Setup instructions supplied by the maintainer, kept ahead of the reference guide. */
export function QuickStart() {
  return (
    <div className="quick-start">
      <h3>KytyPS5: download and setup</h3>
      <p>
        <strong>What you need</strong>
      </p>
      <ul>
        <li>
          A current Windows version or a current Linux distribution. macOS on
          Apple Silicon is experimental.
        </li>
        <li>
          A 64-bit x86 CPU and a <strong>Vulkan 1.3</strong> GPU with up-to-date
          drivers.
        </li>
        <li>
          Games <strong>you dumped yourself</strong>: a folder with{" "}
          <code>eboot.bin</code> and <code>sce_sys\</code>, or a{" "}
          <code>.zar</code> archive.
        </li>
      </ul>
      <ol className="quick-start-steps">
        <li>
          <h4>Download</h4>
          <p>
            Go to{" "}
            <External href={`${repoUrl}/releases`}>KytyPS5 releases</External>,
            open the newest release and, under <strong>Assets</strong>,
            download:
          </p>
          <ul className="quick-start-assets">
            <li>
              <strong>Windows:</strong>{" "}
              <code>KytyPS5-&lt;date&gt;-&lt;commit&gt;-Windows-x64.zip</code>
            </li>
            <li>
              <strong>Linux:</strong>{" "}
              <code>
                KytyPS5-&lt;date&gt;-&lt;commit&gt;-Linux-x86_64.tar.gz
              </code>
            </li>
            <li>
              <strong>macOS:</strong>{" "}
              <code>KytyPS5-&lt;date&gt;-&lt;commit&gt;-macOS-x86_64.zip</code>
            </li>
          </ul>
          <p>
            Not every release has all three. If yours is missing, take the
            newest release that has it. Don’t download “Source code”. Some games
            run better on a fork. Check that game’s thread.
          </p>
        </li>
        <li>
          <h4>Extract</h4>
          <p>
            Extract it into its own folder that you can write to, e.g.{" "}
            <code>C:\KytyPS5\</code>, rather than <code>Program Files</code>.
            The emulator writes its save data, patches and logs there.
          </p>
        </li>
        <li>
          <h4>Add your games</h4>
          <p>
            Put every game in its own subfolder, e.g.{" "}
            <code>{String.raw`X:\PS5 Games\Astro Bot\eboot.bin`}</code>. Start{" "}
            <strong>
              <code>launcher.exe</code>
            </strong>{" "}
            instead of <code>kyty_emulator.exe</code>.
          </p>
          <p>
            Open <strong>Global settings… → Game folders</strong> and add the{" "}
            <strong>parent</strong> folder (
            <code>{String.raw`X:\PS5 Games`}</code> in this example). The
            launcher finds the games inside it. If one is missing, press{" "}
            <strong>Refresh game list</strong>.
          </p>
        </li>
        <li>
          <h4>Game settings</h4>
          <p>
            Right-click the game → <strong>Edit game settings…</strong>
          </p>
          <ul>
            <li>
              <strong>Windows SysV red zone crash protection:</strong> turn it
              on when using Windows. It prevents crashes in many games.
            </li>
            <li>
              <strong>AMD CPU patch:</strong> try it if a game crashes on an
              Intel CPU.
            </li>
            <li>
              Other options (readback, tessellation, skip shaders…): only when
              the game’s thread says so.
            </li>
          </ul>
        </li>
        <li>
          <h4>Patches</h4>
          <p>
            Only for games that need them, e.g. Astro Bot. Make a folder{" "}
            <code>_Patches</code> next to <code>launcher.exe</code> and put the
            patch in it, named after the game’s title ID:
          </p>
          <pre>
            <code>{String.raw`_Patches\PPSA21567.json`}</code>
          </pre>
          <p>
            The launcher applies it by itself. Right-click the game →{" "}
            <strong>Cheats (experimental)…</strong> to see or toggle it. The
            game threads say where to get the patches.
          </p>
        </li>
        <li>
          <h4>Play</h4>
          <p>
            Select the game and press <strong>Run</strong>.
          </p>
          <ul>
            <li>
              The first start of a game is slow because shaders are being
              compiled. Later starts are faster.
            </li>
            <li>
              After you update the emulator, the shaders are compiled again.
            </li>
            <li>
              Controllers work. Change the keyboard keys with{" "}
              <strong>Edit input mapping</strong>.
            </li>
          </ul>
        </li>
      </ol>
    </div>
  );
}
