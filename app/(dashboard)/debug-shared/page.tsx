import { createClient } from "@/lib/supabase/server";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";

export default async function DebugSharedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: accounts, error } = await getMySharedAccounts();

    return (
        <div className="p-8 space-y-4 font-mono text-sm">
            <h1 className="text-xl font-bold">Diagnóstico de Cuentas Compartidas</h1>

            <section className="p-4 border rounded bg-muted">
                <h2 className="font-bold border-b mb-2">Usuario Actual</h2>
                <pre>{JSON.stringify(user, null, 2)}</pre>
            </section>

            <section className="p-4 border rounded bg-muted">
                <h2 className="font-bold border-b mb-2">Resultado getMySharedAccounts</h2>
                <p>Error: {error || 'ninguno'}</p>
                <p>Cantidad de cuentas: {accounts?.length || 0}</p>
                <pre>{JSON.stringify(accounts, null, 2)}</pre>
            </section>

            <section className="p-4 border rounded bg-blue-50 text-blue-800">
                <h2 className="font-bold mb-2">Instrucciones</h2>
                <ol className="list-decimal ml-4">
                    <li>Verifica que el <b>id</b> del usuario arriba coincida con el que esperas.</li>
                    <li>Si &quot;Cantidad de cuentas&quot; es 0, el problema es RLS o no te has unido correctamente.</li>
                    <li>Si aparece la cuenta aquí pero no en la página normal, el problema es el componente UI.</li>
                </ol>
            </section>
        </div>
    );
}
