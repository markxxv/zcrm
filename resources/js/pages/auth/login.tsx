import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <>
            <Head title="Log in" />

            <main className="flex min-h-svh items-center justify-center bg-muted px-4 py-6 dark:bg-background">
                <div className="isolate w-full max-w-sm">
                    <img
                        src="/img/mascot.webp"
                        alt=""
                        aria-hidden="true"
                        width={900}
                        height={900}
                        className="pointer-events-none relative mx-auto -mb-14 block w-48 select-none sm:-mb-16 sm:w-56"
                    />

                    <section className="relative z-10 rounded-2xl bg-card p-6 text-card-foreground shadow-xl shadow-black/5 sm:p-8 dark:bg-sidebar dark:shadow-black/20">
                        <h1 className="mb-6 text-center text-xl font-semibold">Log in</h1>

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="grid gap-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoComplete="email"
                                            placeholder="email@example.com"
                                            className="h-10 rounded-lg border-0 bg-muted shadow-none"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="flex flex-wrap items-center justify-between gap-1">
                                            <Label htmlFor="password">Password</Label>
                                            {canResetPassword && (
                                                <TextLink href={request()} className="text-xs">
                                                    Forgot password?
                                                </TextLink>
                                            )}
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            autoComplete="current-password"
                                            placeholder="Password"
                                            className="h-10 rounded-lg border-0 bg-muted shadow-none"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Checkbox id="remember" name="remember" />
                                        <Label htmlFor="remember">Remember me</Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-1 h-10 w-full rounded-lg"
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && <Spinner />}
                                        Log in
                                    </Button>
                                </>
                            )}
                        </Form>

                        {status && (
                            <div role="status" className="mt-4 text-center text-sm font-medium text-green-600 dark:text-green-400">
                                {status}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
