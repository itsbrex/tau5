defmodule Tau5.Discovery.AckReceiver do
  use GenServer, restart: :transient
  require Logger

  def start_link(info) do
    GenServer.start_link(__MODULE__, info)
  end

  @impl true
  def init({interface, token}) do
    socket_options = [
      :binary,
      {:active, true}
    ]

    {:ok, socket} = :gen_udp.open(0, socket_options)
    {:ok, allocated_port} = :inet.port(socket)

    Logger.info(
      "Discovery receiver started for interface #{inspect(interface)} - listening on port #{inspect(allocated_port)}"
    )

    state = %{socket: socket, port: allocated_port, token: token, interface: interface}
    {:ok, state}
  end

  def port(pid) do
    GenServer.call(pid, :get_port)
  end

  def interface(pid) do
    GenServer.call(pid, :get_interface)
  end

  @impl true



  def handle_call(:get_interface, _from, state) do
    {:reply, state.interface, state}
  end

  @impl true
  def handle_call(:get_port, _from, state) do
    {:reply, state.port, state}
  end

  @impl true
  def handle_info({:udp, _socket, src_ip, src_port, data}, %{token: token} = state) do
    Logger.debug(
      "Ack Receiver - incoming data: #{inspect(data)} from #{inspect(src_ip)}:#{inspect(src_port)}"
    )

    case Jason.decode(data) do
      {:ok,
       %{
         "cmd" => "ack",
         "node_uuid" => sender_node_uuid,
         "hostname" => sender_hostname,
         "metadata" => sender_metadata,
         "token" => ^token,
         "other_nodes" => other_nodes
       }} ->
        Logger.debug(
          "Adding sender node #{inspect(sender_hostname)} (#{sender_node_uuid}) on interface #{inspect(state.interface)}"
        )

        Tau5.Discovery.KnownNodes.add_node(
          state.interface,
          sender_hostname,
          src_ip,
          sender_node_uuid,
          sender_metadata,
          false
        )

        Enum.map(other_nodes, fn [hostname, ip, node_uuid, metadata] ->
          Logger.debug(
            "Adding other node  #{inspect(hostname)} (#{node_uuid}) on interface #{inspect(state.interface)}"
          )

          Tau5.Discovery.KnownNodes.add_node(
            state.interface,
            hostname,
            List.to_tuple(ip),
            node_uuid,
            metadata,
            true
          )
        end)

      _ ->
        Logger.error("Ack Receiver failed to decode data: #{inspect(data)}")
    end

    {:noreply, state}
  end
end
